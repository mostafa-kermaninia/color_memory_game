<!-- RUN ON SERVER FROM GITHUB -->
<!-- ورود به هاست -->
root@DESKTOP-AGHA-MOSTAFA:~# ssh mostafa@65.109.186.25
<!-- دریافت اپدیت ها از گیتهاب -->
cd ../../var/www/color_memory/
mostafa@ubuntu-4gb-hel1-4:/var/www/mini-app$ git fetch origin
mostafa@ubuntu-4gb-hel1-4:/var/www/mini-app$ git pull
<!-- ساخت بیلد جدید فرانت -->
mostafa@ubuntu-4gb-hel1-4:/var/www/mini-app$ cd frontend && npm run build && cd ..
<!-- ریست کردن ران خودکار بک اند -->
mostafa@ubuntu-4gb-hel1-4:/var/www/mini-app$ pm2 restart mini-backend


<!-- گرفتن لاگ های بک اند-->
pm2 list 
<!-- بعدش اون بک اندی که میخوای را آیدیشو بردار و مثلا اگر 0 بود -->
pm2 logs 0
<!-- پاک کردن لاگ های قبلی برای تمرکز بیشتر -->
pm2 flush


<!-- LOCAL RUN -->
0: dont forget this:
D:\GitHub\mini-app\backend\.env :
PORT=10000
BOT_TOKEN= "SALAM"

T0:
PS D:\GitHub\mini-app\backend> npm install
PS D:\GitHub\mini-app\frontend> npm install
passwoed : https://whatismyipaddress.com/

T1:
PS D:\GitHub\mini-app\backend> node Server.js

T2:
PS D:\GitHub\mini-app> lt --port 10000 --subdomain math-backend --local-https false

T3:
PS D:\GitHub\mini-app\frontend>npm start

T4:
PS D:\GitHub\mini-app> lt --port 3000 --subdomain my-frontend --local-https false

BOT father:
Domain:
https://math-backend.loca.lt

Webapp URL:
https://my-frontend.loca.lt



<!-- بررسی و اتصال به دیتابیس -->
<!-- داخل دایرکتوری اصلی mini-app در هاست -->
mostafa@ubuntu-4gb-hel1-4:/var/www/mini-app$ mysql -u momis_user -p
<!-- بعدش پسوورد طولانیه که تو پیوی ندافه -->
mysql> USE momisdb;
<!-- مثلا دیدن یوزر ها -->
mysql> SELECT * FROM users ORDER BY createdAt DESC LIMIT 10;
<!-- دیدن اخرین امتیازای همه کاربرا -->
mysql> SELECT s.score, s.createdAt, u.username  FROM scores AS s  JOIN users AS u ON s.userTelegramId =
u.telegramId  ORDER BY s.createdAt DESC LIMIT 10;


<!-- ریست و آپدین کردن دیتابیس بدون حذف دیتای قبلیب -->
mostafa@ubuntu-4gb-hel1-4:/var/www/mini-app/backend/DataBase$ node syncDatabase.js