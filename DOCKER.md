# Docker

Configuracion Docker para desplegar PinTheBall sin usar XAMPP, LAMP ni MAMP. El acceso se hace mediante Nginx y un dominio resuelto por el DNS configurado manualmente en Debian.

## Servicios

- `nginx`: servidor web en el puerto 80.
- `frontend`: Angular.
- `backend`: Laravel.
- `mysql`: MySQL 8.
- `phpmyadmin`: administracion de MySQL.

## Configuracion previa

Copia el archivo de ejemplo y configura el dominio de la aplicacion:

```bash
cp .env.docker.example .env
```

Ejemplo:

```env
DNS_DOMAIN=pintheball
```

El DNS se configura manualmente en Debian con `dnsmasq`. La IP usada para resolver `pintheball` es la IP fija de la maquina virtual: `192.168.56.101`.

## Arranque

```bash
docker-compose up --build -d
```

Acceso desde el portatil:

- Aplicacion: `http://pintheball`
- API: `http://pintheball/api`
- phpMyAdmin: `http://pintheball/phpmyadmin`

## Base de datos

- Base de datos: `pintheball`
- Usuario: `pintheball`
- Password: `pintheball`
- Root password: `root`
- Host interno desde Laravel: `mysql`

## Comandos utiles

```bash
docker-compose ps
docker-compose logs -f
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose exec backend php artisan migrate:fresh --seed
docker-compose exec backend php artisan test
docker-compose exec mysql mysql -u pintheball -ppintheball pintheball
docker-compose down
```

Para borrar tambien la base de datos persistida:

```bash
docker-compose down -v
```

El manual completo esta en `MANUAL_DESPLIEGUE_VM.md`.
