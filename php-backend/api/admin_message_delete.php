<?php
require __DIR__ . '/bootstrap.php';method('POST');admin_required();$x=input();$id=(int)($x['id']??0);if($id<1)respond(422,['error'=>'Invalid message.']);$q=db()->prepare('DELETE FROM soft_ride_messages WHERE id=?');$q->execute([$id]);respond(200,['ok'=>true]);
