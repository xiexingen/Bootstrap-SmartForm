/*================智能搜索
*options:{
* url:'',
* blurCheck:true,离开时候是否检测输入有效
* key:'',//要填充的键名(先使用配置的key，如果没有元素的data-key属性，如果没有则使用value属性值)
* postKey:'',//查询时，发送的键
* className:'',
* beforeSearch:function(postData,$target){}, //查询之前对发送的数据进行操作
* formatItem:null,//function(data){return '';} //格式化，特殊场景
* },
* callback:function(selectData){}//处理特殊场景，比如填充后面的某些值,selectData：选择的数据项
* NOTE:支持的数据源为[{label:'',value:''}] 支持字符串数组，json数组
*/
$.fn.SmartSearch = function (options, callback) {
    var config = $.extend(true, {
        method: 'get',
        dataType: 'json',
        focusSetValue: true,//选中是否赋值到文本框
        minLength: 1,
        postData: { pageNum:1, pageSize:10 },
        processData: function (data) { //将服务器返回的数据格式修改为业务数据格式
            //if (data['code'] != '200') {
            //    global.Fn.ShowMsg({
            //        type: 'alert:error',
            //        msg: data['message']
            //    });
            //    return false;
            //}
            //return data['info'];
            return data||[];
        },
    }, options);

    /*===============autocomplet设置值
     * ui:{}数据源
     */
    function SetAutoCompleteValue(item) {
        //if (!item) { return; }
        item = item || {};
        if (config.callback) {
            config.callback(item);
        }
        else {
            var key = config.key || $target.data('key');
            if (key) {
                $target.val(item[key]);
            }
        }
        $target.data('triggerSelect', true);
    }

    var $target = $(this);
    var curXHR;//存放jqXHR对象，用于取消上一次的请求
    var curItem;//存放当前选择的对象
    $target.autocomplete({
        source: function (request, response) {
            $.ajax({
                beforeSend: function (jqXHR) {
                    if (curXHR !== null && curXHR !== undefined) {
                        curXHR.abort();
                    }
                    curXHR = jqXHR;
                },
                dataType: config.dataType,
                type: config.method,
                url: config.url,
                data: config.postData,
                success: function (data) {
                    $target.removeClass('ui-autocomplete-loading');  // hide loading image
                    data = config.processData(data);
                    response($.map(data, function (item) {
                        if (config.formatItem) {
                            var retVal = config.formatItem(item);
                            if (typeof (retVal) === 'string') {
                                return { label: retVal, value: item };
                            }
                            else {
                                return retVal;
                            }
                        }
                        else {
                            return item;
                        }
                    }));
                },
                error: function (data) {
                    $target.removeClass('ui-autocomplete-loading');
                },
                complete: function (jqXHR) {
                    curXHR = null;
                }
            });
        },
        minLength: config.minLength,
        //autoFocus: true,
        delay: 500,
        //open: function (event, ui) { //ui:{label:'',value:''}
        //},
        //close: function () {
        //},
        change: function (event, ui) {
            if (ui.item != null && ui.item) {
                SetAutoCompleteValue(ui.item.value);
            }
            else {
                $target.data('triggerSelect', false);
            }
        },
        //response: function (eve, ui) {
        //},
        search: function (event, ui) {
            var postData = {};
            postData[config.postKey || 'sc'] = $target.val();
            config.postData = $.extend(true, config.postData, postData);
            if (config.beforeSearch) {
                config.postData = (config.beforeSearch(config.postData, $target) || config.postData);
            }
        },
        focus: function (event, ui) { //ui:{label:'',value:''}
            if (config.focusSetValue) {
                SetAutoCompleteValue(ui.item.value);
            }
            return false;
        },
        select: function (event, ui) { //ui:{label:'',value:''}
            event.preventDefault();
        }
    });
}


/*==============根据输入填充
* options:{
* url:'',
* key:'',//要填充的键名(先使用配置的key，如果没有元素的data-key属性，如果没有则使用value属性值)
* postKey:'',//查询时，发送的键
* beforeSearch:function(postData,$target){}, //查询之前对发送的数据进行操作
 * processData:function(data){//DO other} //默认为null
 * }
 */
$.fn.AutoFill = function (options) {
    var config = $.extend(true, {
        method: 'get',
        dataType: 'json',
        processData: function (data) { //将服务器返回的数据格式修改为业务数据格式
            //if (data['code'] != '200') {
            //    global.Fn.ShowMsg({
            //        type: 'alert:error',
            //        msg: data['message']
            //    });
            //    return false;
            //}
            //return data['info'];
            return data;
        },
        //url: '',
        //key: '', //有该列表示为json数据，否则作为字符串
        // beforeSearch:function(postData,$target){}, //查询之前对发送的数据进行操作,
        //callback:function(result){}//处理特殊场景，比如填充后面的某些值,result：响应的结果
    }, options);

    var $target = $(this);
    $target.bind('change.autofill', function () {
        //使用setTimeout确保change事件在 smartSearch的change事件之后执行
        setTimeout(function () {
            if ($target.data('triggerSelect') === true) {
                return true;
            }
            else {
                var postData = {};
                postData[config.postKey || 'sc'] = $target.val();
                if (config.beforeSearch) { postData = (config.beforeSearch(postData, $target) || postData); }
                $.ajax({
                    dataType: config.dataType,
                    type: config.method,
                    url: config.url,
                    data: postData,
                    success: function (data) {
                        data = config.processData(data) || {};
                        if (config.key && $.type(data) == 'string') {
                            data = JSON.parse(data);
                        }
                        if (config.callback) {
                            config.callback(data);
                        }
                        else {
                            if (config.key) {
                                $target.val(data[config.key]);
                            }
                            else {
                                $target.val(data);
                            }
                        }
                    }
                });
            }
        }, 1)
    });
}
