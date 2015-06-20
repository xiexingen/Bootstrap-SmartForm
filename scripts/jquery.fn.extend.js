/*================智能搜索
*options:{
* url:'',
* key:'',//数据中的列名
* className:'',
* beforeSearch:function(postData){}, //查询之前对发送的数据进行操作
* formatItem:null,//function(data){return '';} //格式化，特殊场景
* },
* callback:function(selectData){}//处理特殊场景，比如填充后面的某些值
* note:支持的数据源为[{label:'',value:''}]
*/
$.fn.SmartSearch = function (options, callback) {
    var config = $.extend(true, {
        method: 'get',
        dataType: 'json',
        minLength: 1,
        postData: {}
    }, options);

    var $target = $(this);
    $target.autocomplete({
        source: function (request, response) {
            $.ajax({
                dataType: config.dataType,
                type: config.method,
                url: config.url,
                data:config.postData,
                success: function (data) {
                    $target.removeClass('ui-autocomplete-loading');  // hide loading image
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
                }
            });
        },
        minLength:config.minLength,
        //open: function (event, ui) { //ui:{label:'',value:''}
        //},
        //close: function () {
        //},
        //response: function (eve, ui) {
        //},
        search: function (event, ui) {
            config.postData = $.extend(true, config.postData, { sc: $(this).val() });
            if (config.beforeSearch) {
                config.beforeSearch(config.postData);
            }
        },
        focus: function (event, ui) { //ui:{label:'',value:''}
            return false;
        },
        select: function (event, ui) { //ui:{label:'',value:''}
            if (config.callback) {
                config.callback(ui['item'].value);
                event.preventDefault();
            }
        }
    });
}