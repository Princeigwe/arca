import { NestFactory, Reflector } from '@nestjs/core';
import {AppModule} from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType, ClassSerializerInterceptor } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, 
  });  

  app.use(helmet());
  app.use(compression());
  app.enableCors();

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

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



  const config = new DocumentBuilder()
    .setTitle('Arca API')
    .setDescription('Arca API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // graceful shutdown
  app.enableShutdownHooks();

  const port = 3000;
  await app.listen(port);
  
  console.log(`API is running on: http://localhost:${port}/v1`);
  console.log(`Documentation available at: http://localhost:${port}/api-docs`);
}

bootstrap();