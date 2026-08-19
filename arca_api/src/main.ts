import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, 
  });  

  const env = process.env.NODE_ENV;
  const blockchainUrl = env === 'production'
    ? process.env.LINEA_MAINNET_RPC
    : env === 'staging'
    ? process.env.LINEA_SEPOLIA_RPC
    : process.env.HARDHAT_RPC;

  // extract the underlying Express instance
  const server = app.getHttpAdapter().getInstance();

  // mount the proxy BEFORE NestJS global features parse or alter requests
  server.use(
    '/v1/blockchain',
    createProxyMiddleware({
      target: blockchainUrl,
      changeOrigin: true, // natively drops '/v1/blockchain' from the final forwarded path in v3+
      secure: true, // enforcing ssl validation
      on: {
        proxyReq: (proxyReq, req: any, res) => {
          // robustly restream parsed bodies back into JSON-RPC format
          if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        },
        proxyRes: (proxyRes, req, res) => {
          if (proxyRes.statusCode !== 200) {
            console.error(`[Proxy Error] Target Node returned status: ${proxyRes.statusCode}`);
          }
        },
      },
    }),
  );



  // apply standard security and performance middleware
  app.use(helmet());
  app.use(compression());
  app.enableCors();

  // attach logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // setup application route versioning (now safely ignored by the proxy path above)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // global Validation (proxied requests will no longer fail here)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // swagger Documentation Configuration
  const config = new DocumentBuilder()
    .setTitle('Arca API')
    .setDescription('Arca API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // graceful shutdown hooks
  app.enableShutdownHooks();

  const port = 3000;
  await app.listen(port);
  
  console.log(`API is running on: http://localhost:${port}/v1`);
  console.log(`Documentation available at: http://localhost:${port}/api-docs`);
}

bootstrap();
