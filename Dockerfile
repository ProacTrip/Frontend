# 1. Usamos una imagen de Node ligera
FROM node:20-alpine

# 2. Creamos la carpeta de trabajo
WORKDIR /app

# 3. Copiamos los archivos de configuración
COPY package*.json ./

# 4. Instalamos las dependencias
RUN npm install

# 5. Copiamos el resto del código
COPY . .

# 6. Exponemos el puerto que usa Next.js
EXPOSE 3000

# 7. Comando para arrancar en modo desarrollo
CMD ["npm", "run", "dev"]