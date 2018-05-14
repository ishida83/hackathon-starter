
var app = getApp();
Page( {

    /**
     * 页面的初始数据
     */
    data: {
        imgUrl:'',
        sex:"请选择性别",
        array: ['男', '女', '其他'],

        name:'',
        age:'',
        height:'',
        bust:'',
        waist:'',
        hip:'',
        position:'',
        address:'',
        habit:'',
        introduction:'',

        uploadingStatus:{
            img:false,
            data:false
        },

        //是否可以上传图片
        uploadDisabled:false

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.initData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {




    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    goToResult:function(){
        wx.setStorageSync('patientName', this.data.patientName);
        wx.navigateTo({
            url: '../timeperiod/timeperiod'
        })
    },
    bindContentInput: function(events) {
        var keyName=events.currentTarget.dataset.name;
        var obj={};
        obj[keyName]=events.detail.value;
        this.setData(obj);
    },
    goBack:function(){
        wx.hideLoading();//TODO:需要刷新前页。
        wx.navigateBack();
    },
    chooseImg:function(){
        var that=this;
        if(that.data.uploadDisabled===false)
        {
            wx.chooseImage({
                count: 1,
                sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
                sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                success: function (res) {
                    // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                    var tempFilePaths = res.tempFilePaths;
                    that.setData({
                        imgUrl:tempFilePaths[0]
                    })
                }
            })
        }
    },
    bindPickerChange:function(e){
        console.log('picker发送选择改变，携带值为', e.detail.value);
        var sexList=this.data.array;
        this.setData({
            index: e.detail.value,
            sex:sexList[e.detail.value]
        })
    },
    commitInfo:function(){
        if(this.data.imgUrl==='')
        {
            wx.showToast({
                title: '请上传图片',
                icon:"none"
            })
        }
        else if(this.data.name===''||this.data.age===''||this.data.height===''||this.data.bust===''||this.data.waist===''||this.data.hip==='')
        {
            wx.showToast({
                title: '请输入必填信息',
                icon:"none"
            })
        }
        else
        {
            wx.showLoading({
                title:"信息提交中"
            });

            if(this.data.uploadDisabled===true)
            {
                this.data.uploadingStatus.img=true;
            }
            else
            {
                this.uploadImgToServer();
            }
            this.uploadDataToServer();
        }
    },

    //将图片上传到服务端
    uploadImgToServer:function(){
        var that=this;
        app.getOpenId(function(openid){
            var serverPath=app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH;
            var apiUrl=serverPath+"/api/uploadImages/"+openid;
            wx.uploadFile({
                url: apiUrl,
                filePath: that.data.imgUrl,
                name: 'myFile',
                formData:{},
                success: function(res){
                    that.data.uploadingStatus.img=true;
                    if(that.data.uploadingStatus.data===true)
                    {
                        that.goBack();
                    }
                    console.log(res);
                },
                fail:function (error) {
                    wx.showToast({
                        title: '图片上传失败',
                        icon:"none"
                    });
                    console.log(error);
                }
            })
        });
    },

    //将数据上传到服务端
    uploadDataToServer:function(){
        var that=this;
        app.getOpenId(function(openid){
            var serverPath=app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH;
            var apiUrl=serverPath+"/api/users?open_id="+openid;
            wx.request({
                url: apiUrl, //仅为示例，并非真实的接口地址
                data:{
                    "name": that.data.name||"",
                    "age": that.data.age||"",
                    "height": that.data.height||"",
                    "bust": that.data.bust||"",
                    "waist": that.data.waist||"",
                    "hip": that.data.hip||"",
                    "position": that.data.position||"",
                    "address":that.data.address|| "",
                    "habit": that.data.habit||"",
                    "introduction": that.data.introduction||"",
                    "telephone":that.data.telephone||"",
                    "sex":that.data.sex==="请选择性别"?"":that.data.sex
                },
                method:"POST",
                header: {
                    'content-type': 'application/json' // 默认值
                },
                success: function(res) {
                    if(res.data.id)
                    {
                        wx.setStorageSync('userId', res.data.id);
                    }


                    that.data.uploadingStatus.data=true;
                    if(that.data.uploadingStatus.img===true)
                    {
                        that.goBack();
                    }
                    console.log(res.data)
                },
                fail:function(error){
                    wx.showToast({
                        title: '提交用户信息失败',
                        icon:"none"
                    });
                    console.error(error)
                }
            });
        });
    },
    initData:function(){
        var that=this;
        app.getOpenId(function(openid){
            var serverPath=app.globalData.GLOBAL_CONFIG[app.globalData.CURRENT_ENVIRONMENT].API_PATH;
            var apiUrl=serverPath+"/api/users/"+openid;
            wx.request({
                url: apiUrl,
                method:"get",
                success: function(res) {
                    console.log(res.data);
                    if(res.data.length>0)
                    {
                        that.setData({
                            "name": res.data[0].name||"",
                            "age": res.data[0].age||"",
                            "height": res.data[0].height||"",
                            "bust": res.data[0].bust||"",
                            "waist": res.data[0].waist||"",
                            "hip": res.data[0].hip||"",
                            "position": res.data[0].position||"",
                            "address":res.data[0].address|| "",
                            "habit": res.data[0].habit||"",
                            "introduction": res.data[0].introduction||"",
                            "telephone":res.data[0].telephone||"",
                            "sex":res.data[0].sex||"请选择性别"
                        });

                        if(res.data[0].images&&res.data[0].images.length>0)
                        {
                            that.setData({
                                "imgUrl":serverPath+"/view/images/"+res.data[0].images[0].path,
                                "uploadDisabled":true//以后都不可以修改图片了
                            })
                        }
                        wx.setStorageSync('userId', res.data[0].userId);
                    }
                },
                fail:function(error){
                    console.error(error)
                }
            })
        });

    }
});