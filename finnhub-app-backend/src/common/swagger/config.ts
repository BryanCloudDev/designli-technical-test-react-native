import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('Designli Technical Test API')
  .setDescription(
    'Documentation of the Designli Technical Test API calling Finnhub API ',
  )
  .setVersion('1.0.0')
  .addServer('http://localhost:3000/', 'Local environment')
  .setContact(
    'Bryan Portillo',
    'https://bryancloud.dev/',
    'bryanportillodev@gmail.com',
  )
  .build();
