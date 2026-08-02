import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as winston from 'winston';
import 'winston-daily-rotate-file'
import { RecoveryModule } from './modules/recovery/recovery.module';
import {TypeOrmModule} from '@nestjs/typeorm'
import {ConfigModule, ConfigService} from '@nestjs/config'
import { AuthModule } from './modules/auth/auth.module';
import { OnchainModule } from './modules/onchain/onchain.module';
import { WinstonModule } from 'nest-winston';




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
      type: 'postgres',
      host: config.get<string>('NODE_ENV') == 'production' ? config.get<string>('ARCA_AIVEN_DB_HOST') : config.get<string>('DB_HOST'),
      port: parseInt(config.get<string>('NODE_ENV') == 'production' ? config.get<string>('ARCA_AIVEN_DB_PORT') : config.get<string>('DB_PORT')),
      username: config.get<string>('NODE_ENV') == 'production' ? config.get<string>('ARCA_AIVEN_USER') : config.get<string>('DB_USERNAME'),
      password: config.get<string>('NODE_ENV') == 'production' ? config.get<string>('ARCA_AIVEN_DB_PASSWORD') : config.get<string>('DB_PASSWORD'),
      database: config.get<string>('NODE_ENV') == 'production' ? config.get<string>('ARCA_AIVEN_DB_NAME') : config.get<string>('DB_NAME'),
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
      })
    }),
    RecoveryModule,
    AuthModule,
    OnchainModule,
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.printf(({ timestamp, level, message, context}) => {
              return `${timestamp} [${context}] ${level} : ${message}`;
            })
          )
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/arca-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
