<?php
require __DIR__ . '/bootstrap.php';method('POST');$x=input();$user=(string)($x['username']??'');$pass=(string)($x['password']??'');if(!hash_equals(ADMIN_USER,$user)||!hash_equals(ADMIN_PASSWORD,$pass))respond(401,['error'=>'Incorrect username or password.']);session_regenerate_id(true);$_SESSION['admin']=true;respond(200,['ok'=>true]);
