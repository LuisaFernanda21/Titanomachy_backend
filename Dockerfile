# Usar Node.js LTS
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Crear usuario no root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Exponer el puerto dinámico
EXPOSE $PORT

# Variables de entorno
ENV NODE_ENV=production

# Comando de inicio
CMD ["npm", "start"]