# 3. Manual de despliegue

En esta seccion se explicara detalladamente como se ha llevado a cabo el despliegue de PinTheBall en un entorno virtual. El proyecto esta formado por una aplicacion frontend desarrollada con Angular, una API backend desarrollada con Laravel y una base de datos MySQL.

El despliegue se realiza mediante Docker, tal y como se ha visto en clase. No se utiliza XAMPP, LAMP ni MAMP. Ademas, la aplicacion no se despliega atacando a `localhost`, sino usando un servidor web Nginx y un servidor DNS para acceder mediante un dominio interno.

El dominio configurado para el proyecto es:

```text
pintheball
```

Las rutas principales del despliegue son:

```text
Aplicacion web: http://pintheball
API Laravel: http://pintheball/api
phpMyAdmin: http://pintheball/phpmyadmin
```

## 3.1. Maquina virtual

Para realizar el despliegue se ha utilizado una maquina virtual creada con Oracle VM VirtualBox.

Las caracteristicas asignadas a la maquina virtual son las siguientes:

- Sistema operativo: Debian 12
- Procesadores: 2 CPUs
- Memoria RAM: 4 GB
- Disco duro virtual: 30 GB
- Adaptador de red: NAT + Adaptador solo-anfitrion

Estas caracteristicas son suficientes para ejecutar Docker y todos los contenedores necesarios para la aplicacion.

La red de la maquina virtual se configura con dos adaptadores. El primer adaptador usa NAT para que Debian tenga acceso a Internet y pueda instalar paquetes. El segundo adaptador usa una red solo-anfitrion para que el portatil pueda acceder siempre a la maquina virtual con la misma IP, independientemente de si se esta en clase, en casa o usando datos del movil.

## 3.2. Preparacion del entorno virtual

Durante la instalacion del sistema operativo se configuraron las siguientes credenciales:

```text
Usuario: ptb
Contrasena: ptbdaw
Contrasena root: ptbdaw
```

## 3.2.1. Primer acceso y permisos de administrador

Se inicia sesion en la maquina virtual con las credenciales configuradas anteriormente:

```text
Usuario: ptb
Contrasena: ptbdaw
```

Lo primero es entrar como usuario `root`:

```bash
su
```

La contrasena de `root` es:

```text
ptbdaw
```

Una vez dentro como `root`, se actualiza el sistema:

```bash
apt update && apt upgrade -y
```

Despues se instala `sudo`, si no estuviera instalado:

```bash
apt install sudo -y
```

Se anade el usuario `ptb` al grupo `sudo` para que pueda ejecutar comandos con permisos de administrador:

```bash
/usr/sbin/usermod -aG sudo ptb
```

Despues se reinicia la maquina virtual:

```bash
reboot
```

Cuando la maquina vuelve a arrancar, se inicia sesion otra vez con el usuario `ptb`. Para comprobar que el usuario tiene permisos de administrador:

```bash
sudo whoami
```

Si el resultado es `root`, los permisos se han aplicado correctamente.

## 3.2.2. Configuracion de red portable

Antes de arrancar la maquina virtual, en VirtualBox se configuran dos adaptadores de red.

El primer adaptador se deja como NAT:

```text
Configuracion > Red > Adaptador 1
Conectado a: NAT
```

Este adaptador se usa para que Debian tenga salida a Internet.

El segundo adaptador se configura como red solo-anfitrion:

```text
Configuracion > Red > Adaptador 2
Habilitar adaptador de red
Conectado a: Adaptador solo-anfitrion
Nombre: VirtualBox Host-Only Ethernet Adapter
```

Si no aparece ningun adaptador solo-anfitrion, se crea desde VirtualBox:

```text
Archivo > Herramientas > Network Manager > Host-only Networks > Crear
```

El adaptador de Windows suele quedar con la IP `192.168.56.1` y mascara `255.255.255.0`. La maquina virtual usara otra IP dentro de esa misma red, en este caso `192.168.56.101`.

Este segundo adaptador crea una red privada entre el portatil y la maquina virtual. Gracias a esto, la IP de despliegue no depende de la WiFi, de la red de clase, de la red de casa ni de los datos del movil.

En este ejemplo se usara la IP:

```text
192.168.56.101
```

Esta IP pertenece a la red solo-anfitrion de VirtualBox y se mantiene estable en el portatil.

Para ello se modifica el archivo:

```bash
sudo nano /etc/network/interfaces
```

El archivo por defecto suele tener una configuracion similar a esta:

```text
auto lo
iface lo inet loopback

allow-hotplug enp0s3
iface enp0s3 inet dhcp
```

Se cambia para dejar `enp0s3` con DHCP para Internet mediante NAT y `enp0s8` con IP estatica para acceder al despliegue desde el portatil:

```text
auto lo
iface lo inet loopback

allow-hotplug enp0s3
iface enp0s3 inet dhcp

auto enp0s8
iface enp0s8 inet static
    address 192.168.56.101
    netmask 255.255.255.0
```

La interfaz `enp0s3` puede tener otro nombre dependiendo de la instalacion. Si al ejecutar `ip a` aparecen nombres distintos, hay que adaptar el archivo a los nombres reales de las interfaces.

Por ejemplo, si el segundo adaptador aparece como `enp0s9` en lugar de `enp0s8`, se debe usar `enp0s9` en el archivo.

Para aplicar los cambios:

```bash
sudo ip addr flush dev enp0s8
sudo systemctl restart networking
```

Se comprueba que la configuracion se ha aplicado correctamente:

```bash
ip a
ip route
ping 8.8.8.8
```

Si `enp0s8` muestra la IP `192.168.56.101` y el `ping` responde, la red queda configurada correctamente.

Tambien se puede comprobar desde el portatil que la maquina virtual es accesible:

```powershell
ping 192.168.56.101
```

Si el ping desde Windows no responde, se revisan estos puntos:

- La maquina virtual debe estar encendida.
- El adaptador 2 de VirtualBox debe estar habilitado.
- El adaptador 2 debe estar en modo `Adaptador solo-anfitrion`.
- En Debian, `ip a` debe mostrar la IP `192.168.56.101` en la segunda interfaz.
- En Windows, `ipconfig` debe mostrar el adaptador `VirtualBox Host-Only Network` con una IP de la red `192.168.56.x`, normalmente `192.168.56.1`.
- Si Debian no muestra `192.168.56.101`, hay que revisar el nombre real de la interfaz y reiniciar la red o la maquina virtual.

Tambien se puede probar a reiniciar la maquina despues de modificar `/etc/network/interfaces`:

```bash
sudo reboot
```

Si durante las pruebas se accede por IP y Angular muestra un mensaje parecido a `Blocked request. This host is not allowed`, hay que comprobar en `frontend/angular.json` que el target `serve` contiene la opcion `allowedHosts` con `192.168.56.101`, `pintheball`, `frontend` y `localhost`. Despues se reconstruye el contenedor del frontend.

## 3.2.3. Instalacion de Docker

Se instala Docker desde los repositorios de Debian:

```bash
sudo apt install docker.io -y
```

Se comprueba que Docker esta funcionando:

```bash
sudo systemctl status docker
```

Para salir de la pantalla de estado se pulsa `q`.

Se habilita Docker para que se inicie automaticamente con el sistema:

```bash
sudo systemctl enable docker
```

Se anade el usuario `ptb` al grupo `docker` para poder ejecutar comandos Docker sin usar `sudo`:

```bash
sudo usermod -aG docker ptb
```

Despues se reinicia la maquina:

```bash
sudo reboot
```

Al volver a iniciar sesion, se comprueba la instalacion:

```bash
docker --version
docker ps
```

## 3.2.4. Instalacion de Docker Compose

Se instala Docker Compose:

```bash
sudo apt install docker-compose -y
```

Se comprueba la instalacion:

```bash
docker-compose --version
```

En este despliegue se usa el comando `docker-compose`, ya que es el paquete instalado desde Debian. Si en otra instalacion se usa el plugin moderno de Docker Compose, el comando equivalente seria `docker compose`.

## 3.2.5. Instalacion de Git

Se instala Git:

```bash
sudo apt install git -y
```

Se comprueba la instalacion:

```bash
git --version
```

## 3.2.6. Clonado del proyecto

Primero nos colocamos en la carpeta en la que se va a guardar la aplicacion:

```bash
sudo mkdir -p /var/www
sudo chown -R ptb:ptb /var/www
cd /var/www
```

Despues se clona el proyecto:

```bash
git clone https://github.com/OscarRamirez2205/PinTheBall
```

Se entra en la carpeta del proyecto:

```bash
cd PinTheBall
```

## 3.3. Arquitectura Docker del proyecto

El proyecto incluye un archivo `docker-compose.yml` que define los servicios de la aplicacion.

Los contenedores usados son:

- `nginx`: servidor web principal y proxy inverso.
- `frontend`: aplicacion Angular.
- `backend`: API Laravel.
- `mysql`: base de datos MySQL.
- `phpmyadmin`: panel web para administrar MySQL.

El servidor DNS se configura manualmente en Debian usando `dnsmasq`. De esta forma, Docker queda reservado para los servicios propios de la aplicacion, mientras que Debian actua como servidor DNS de la maquina virtual.

La ventaja de esta estructura es que no hace falta instalar manualmente Apache, PHP, Node, MySQL ni phpMyAdmin en Debian. Esos servicios quedan aislados dentro de contenedores Docker, y el DNS queda configurado de forma clara en el sistema.

## 3.4. Configuracion del dominio en Docker

Antes de levantar los contenedores, se crea el archivo `.env` del despliegue a partir del archivo de ejemplo:

```bash
cp .env.docker.example .env
```

Se edita el archivo:

```bash
nano .env
```

Ejemplo:

```env
DNS_DOMAIN=pintheball
```

Esta variable se usa para que Laravel y phpMyAdmin generen URLs con el dominio del proyecto.

## 3.5. Configuracion manual del servidor DNS

Para cumplir el requisito de configurar un servidor DNS, se instala `dnsmasq` directamente en Debian:

```bash
sudo apt install dnsmasq -y
```

Despues se crea un archivo de configuracion para el dominio del proyecto:

```bash
sudo nano /etc/dnsmasq.d/pintheball.conf
```

Se anade el siguiente contenido:

```text
address=/pintheball/192.168.56.101
```

Con esta linea, el servidor DNS resolvera el dominio `pintheball` hacia la IP fija de la maquina virtual.

Se reinicia el servicio:

```bash
sudo systemctl restart dnsmasq
```

Se comprueba que el servicio esta funcionando:

```bash
sudo systemctl status dnsmasq
```

Para salir de la pantalla de estado se pulsa `q`.

Tambien se puede comprobar desde Debian:

```bash
dig @127.0.0.1 pintheball
```

Si `dig` no esta instalado, se instala con:

```bash
sudo apt install dnsutils -y
```

## 3.6. Configuracion del servidor web Nginx

El servidor web obligatorio se configura con Nginx. Nginx se ejecuta dentro de Docker y escucha en el puerto 80.

Su configuracion se encuentra en:

```text
docker/nginx/default.conf
```

Nginx actua como proxy inverso:

- Las peticiones a `/` se envian al contenedor de Angular.
- Las peticiones a `/api` se envian al contenedor de Laravel.
- Las peticiones a `/phpmyadmin` se envian al contenedor de phpMyAdmin.

De esta forma, todo el proyecto se sirve usando un unico dominio:

```text
http://pintheball
```

## 3.7. Levantar los contenedores

Antes de levantar los contenedores, se comprueba que se esta en la raiz del proyecto:

```bash
pwd
ls
```

Tambien se comprueba que existen los archivos necesarios para Docker:

```bash
ls docker-compose.yml
ls backend/Dockerfile
ls backend/.dockerignore
ls frontend/Dockerfile
ls frontend/.dockerignore
ls docker/nginx/default.conf
ls backend/composer.lock
ls frontend/package-lock.json
```

Tambien se crea el archivo `.env` del backend a partir del ejemplo:

```bash
cp backend/.env.example backend/.env
```

Desde la raiz del proyecto se ejecuta:

```bash
docker-compose up --build -d
```

Este comando construye las imagenes necesarias y arranca todos los contenedores en segundo plano.

Para comprobar que estan funcionando:

```bash
docker-compose ps
```

Los contenedores esperados son:

- `pintheball-nginx`
- `pintheball-frontend`
- `pintheball-backend`
- `pintheball-mysql`
- `pintheball-phpmyadmin`

## 3.8. Inicializacion de Laravel y MySQL

Una vez levantados los contenedores, se preparan manualmente las tareas iniciales de Laravel.

La configuracion de MySQL es:

```text
Base de datos: pintheball
Usuario: pintheball
Contrasena: pintheball
Usuario root: root
Contrasena root: root
Host interno de MySQL: mysql
```

El host `mysql` solo se usa dentro de Docker. Desde el navegador no se accede directamente a MySQL.

Primero se genera la clave de Laravel:

```bash
docker-compose exec backend php artisan key:generate
```

Por ultimo se ejecutan las migraciones:

```bash
docker-compose exec backend php artisan migrate --force
```

## 3.9. Cargar datos de prueba

Para cargar los seeders del proyecto:

```bash
docker-compose exec backend php artisan migrate:fresh --seed
```

Este comando reinicia la base de datos, vuelve a ejecutar las migraciones y carga datos iniciales.

Usuarios de prueba:

```text
Administrador: admin@pintheball.com
Jugador: player1@pintheball.com
Contrasena: 123456
```

## 3.10. Configuracion DNS en el portatil

En el apartado anterior se ha configurado `dnsmasq` dentro de Debian. Eso significa que la maquina virtual ya sabe resolver el dominio `pintheball`.

Antes de cambiar nada en Windows, se puede comprobar desde el portatil que el DNS de Debian responde. Para ello se indica explicitamente que el servidor DNS es la IP de la maquina virtual:

```powershell
nslookup pintheball 192.168.56.101
```

La respuesta debe devolver:

```text
Name: pintheball
Address: 192.168.56.101
```

Si este comando no devuelve la IP correcta, el problema esta en `dnsmasq` o en la conexion con la maquina virtual. Si este comando funciona, entonces el DNS de Debian esta bien configurado.

Para que funcione escribiendo solamente `nslookup pintheball` o abriendo `http://pintheball` en el navegador, falta que Windows pregunte a ese DNS por defecto.

Para ello, en Windows se configura el adaptador de red de VirtualBox:

```text
Panel de control
Red e Internet
Centro de redes y recursos compartidos
Cambiar configuracion del adaptador
```

En esa pantalla debe aparecer un adaptador llamado parecido a:

```text
VirtualBox Host-Only Network
```

Se hace clic derecho sobre ese adaptador y se entra en:

```text
Propiedades > Protocolo de Internet version 4 (TCP/IPv4) > Propiedades
```

En la parte inferior se selecciona:

```text
Usar las siguientes direcciones de servidor DNS
```

En `Servidor DNS preferido` se escribe la IP de la maquina virtual:

```text
192.168.56.101
```

Con esto, Windows preguntara a la maquina virtual cuando necesite resolver el dominio `pintheball`.

Despues se abre una terminal de Windows y se comprueba:

```powershell
nslookup pintheball
```

La respuesta debe devolver la IP de la maquina virtual:

```text
192.168.56.101
```

Si en la salida aparece `Servidor: dns.google` o `Address: 8.8.8.8`, significa que Windows todavia esta usando el DNS de Google y no el DNS de Debian. En ese caso hay que revisar que el DNS preferido se haya cambiado en el adaptador `VirtualBox Host-Only Network`.

## 3.11. Acceso a la aplicacion

Una vez levantados los contenedores y configurado el DNS, se accede desde un navegador usando:

```text
http://pintheball
```

La API queda disponible en:

```text
http://pintheball/api
```

phpMyAdmin queda disponible en:

```text
http://pintheball/phpmyadmin
```

Credenciales de phpMyAdmin:

```text
Servidor: mysql
Usuario: root
Contrasena: root
```

Tambien se puede entrar con el usuario de la aplicacion:

```text
Usuario: pintheball
Contrasena: pintheball
```

## 3.12. Comandos de mantenimiento

Ver el estado de los contenedores:

```bash
docker-compose ps
```

Ver los logs de todos los servicios:

```bash
docker-compose logs -f
```

Ver solo los logs del backend:

```bash
docker-compose logs -f backend
```

Ver solo los logs de Nginx:

```bash
docker-compose logs -f nginx
```

Ejecutar migraciones:

```bash
docker-compose exec backend php artisan migrate --force
```

Ejecutar tests del backend:

```bash
docker-compose exec backend php artisan test
```

Entrar en MySQL desde terminal:

```bash
docker-compose exec mysql mysql -u pintheball -ppintheball pintheball
```

Detener los contenedores:

```bash
docker-compose down
```

Detener los contenedores y borrar tambien la base de datos:

```bash
docker-compose down -v
```

## 3.13. Actualizar el proyecto

Para actualizar el proyecto desde GitHub:

```bash
cd /var/www/PinTheBall
git pull
docker-compose up --build -d
docker-compose exec backend php artisan migrate --force
```

Si se cambia el dominio, se modifica el archivo `.env`:

```bash
nano .env
```

Y se reinician los contenedores:

```bash
docker-compose down
docker-compose up --build -d
```

## 3.14. Verificacion final

El despliegue se considera correcto cuando se cumplen las siguientes comprobaciones:

- `docker-compose ps` muestra todos los contenedores en ejecucion.
- `nslookup pintheball` devuelve la IP de la maquina virtual: `192.168.56.101`.
- Al abrir `http://pintheball` se carga la aplicacion Angular.
- Las peticiones a `http://pintheball/api` llegan al backend Laravel.
- `http://pintheball/phpmyadmin` muestra el panel de phpMyAdmin.

Con esta configuracion se cumplen los requisitos del despliegue: se utiliza Docker, se configura un servidor web Nginx, se configura un servidor DNS, no se usa XAMPP, LAMP ni MAMP, y el acceso a la aplicacion se realiza mediante un dominio en lugar de `localhost`.
