import dotenv from 'dotenv';
import app from './src/app.js';
import prisma from './src/lib/prisma.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
}

bootstrap();
