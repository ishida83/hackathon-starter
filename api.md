1.
GET /api/images
获取所有图片列表
?page   optional
?q      optional 全文搜索
response:
[{
    "id": 1,
    "path": "1525593269299-timg (1).jfif",
    "count": 0,
    "userId": 100
}]

2.
GET /api/images/:image_id
获取单张图片
?q      optional 全文搜索
response:
{
    "id": 1,
    "path": "1525593269299-timg (1).jfif",
    "count": 0,
    "userId": 100
}

3.
DELETE /api/images/:image_id
删除图片

4.
POST /api/uploadImages/:open_id
上传图片
<input type="file" name="myFile" />
open_id     mandatory 微信用户的open id

5.
POST /api/like
点赞图片
?open_id    mandatory 微信用户的open id
?image_id   mandatory 被删除图片id

6.
POST /api/unlike
取消点赞图片
?open_id    mandatory 微信用户的open id
?image_id   mandatory 被删除图片id

7.
POST /api/users(/)?:open_id?
上传图片会自动创建用户，无需调用此API， 也可以在修改用户信息时调用
?open_id    both 微信用户的open id 可以附属在url上也可以加在querystring
formData: 
{
    "name": "ishida",
    "open_id": "qwerty",
    "sex": 0,
    "habit": "爱好"
}

8.
PUT /api/users/:open_id
修改用户信息
open_id     mandatory 微信用户的open id
formData: 
{
    "name": "ishida",
    "open_id": "qwerty",
    "sex": 0,
    "habit": "爱好"
}

9.
GET /api/users
获取所有用户列表
?q      optional 全文搜索
respoonse:
[{
    "name": "ishida",
    "open_id": "qwerty",
    "sex": 0,
    "id": 102,
    "habit": "爱好"
}]

10.
GET /api/users/:open_id
获取单个用户信息
?q      optional 全文搜索
response:
{
    "name": "ishida",
    "open_id": "qwerty",
    "sex": 0,
    "id": 102,
    "habit": "爱好"
}

11.
GET /api/wechat/open_id
获取用户open id
?code      mandatory wechat登陆后获取到的access code

12.
GET /fs/tree
查看所有图片restful 风格

13.
GET /view/images
查看所有图片explorer 风格
