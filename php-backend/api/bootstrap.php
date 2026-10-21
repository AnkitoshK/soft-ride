<?php
require_once dirname(__DIR__) . '/config.php';
header('Content-Type: application/json; charset=utf-8');header('X-Content-Type-Options: nosniff');header('Cache-Control: no-store');
$secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';session_name('softride_admin');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);session_start();
function respond(int $status,array $data):never{http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function input():array{$d=json_decode(file_get_contents('php://input')?:'{}',true);if(!is_array($d))respond(400,['error'=>'Invalid request data.']);return $d;}
function admin_required():void{if(empty($_SESSION['admin']))respond(401,['error'=>'Please sign in again.']);}
function method(string $expected):void{if(($_SERVER['REQUEST_METHOD']??'')!==$expected)respond(405,['error'=>'Method not allowed.']);}

set_exception_handler(function(Throwable $e): void { error_log($e); respond(500,['error'=>'The request could not be completed.']); });
