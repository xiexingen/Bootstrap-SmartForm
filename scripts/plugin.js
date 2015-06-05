/*
    tableConfig:{
        table: {
            className: 'table table-responsive table-bordered table-hover',
            keyName: '',
            container: 'pagedDataTable',
            selectOnCheck:true  //是否点击的时候选中
        },
        columns: [
            {
            title:'',column:'',
            formatter:function(value){},//格式化方法
            source:''|[]    //格式化数据源，如果formatter使用预定义方法，此处需要指定数组数据源或者数据源key,key会从global.datasource中取
            }
        ],
        pagination: {
            rownumber: true, //行号
            singleSelect: false,//是否单选
            operator:true,  //是否含有操作列
            url: '',    
            autoLoad:true,  //是否自动请求数据
            method: 'get',  
            pageIndex: 1,
            pageSize: 12,
            queryParameter: {}, //查询的表单
            successCallBack: null// function (data) { return data;} //执行成功后的回调函数
        },
        outOperator:{ //外部操作，如 查询、删除等
            search: {
                targetId: 'btnSearch', //查询按钮id
                'form':"dataGridSearch", //查询按钮关联的表单id
                resetId: 'btnReset',//重置表单按钮id
                beforeSearch:undefined //发送查询请求之前，可以对post的数据做额外处理
            },
            del:{
                url:'',
                method:'get'
            },
        },
        operator:{  //对应于行内的操作栏,可以无限极添加自定义按钮
            edit:{
                url:'',
                method:'get',
                ajax:false,
                formatter:function(rowData){return '<a>xxx</a>'}
            },
            view:undefind,
            del:undefind,
            download:undefind
        }
    }
*/
function PagedDataTable(tableConfig) {
    var defaultConfig = {
        table: {
            className: 'table table-responsive table-bordered table-hover',
            keyName: '',
            container: 'pagedDataTable',
            selectOnCheck: true
        },
        columns: [],
        pagination: {
            rownumber: true, //行号
            singleSelect: false,//是否单选
            url: '',
            autoLoad: true,  //是否自动请求数据
            method: 'post',
            pageIndex: 1,
            pageSize: 12,
            queryParameter: {}, //查询的表单
            successCallBack: null// function (data) { return data;} //查询数据成功后的回调，用于对数据的处理
        },
        operator: undefined,
        outOperator: {
            search: {
                targetId: 'btnSearch', //查询按钮id
                form: "dataGridSearch", //查询按钮关联的表单id
                beforeSearch: undefined,
                resetId: 'btnReset'
            },
            del: {
                url: '',
                method: 'post',
                targetId: 'btnDelete'
            },
        }
    };
    var buttons = {
        //del: {
        //    ajax: true,
        //    primaryKey: undefined, //guid列名，如果没有 则使用配置的列名
        //    html: '<button data-select="false" data-op="del" data-id="{id}" type="button" class="btn btn-xs btn-primary">删除</button>',
        //    handle: function (id, grid, $target) {
        //        var data = {};
        //        data[grid.config.operator.del.primaryKey || grid.config.table.keyName] = id;
        //        global.Fn.BaseAjax({
        //            url: grid.config.operator.del.url,
        //            method: 'get',
        //            postData: data,
        //            target: $target,
        //            callback: function () {
        //                grid.Search();
        //            }
        //        });
        //    }
        //},
        download: {
            ajax: true, html: '<button data-select="false" data-op="download" data-id="{id}" type="button" class="btn btn-xs btn-primary">下载</button>',
            handle: function (id, grid, $target) {
                var data = {};
                data[grid.config.operator.del.primaryKey || grid.config.table.keyName] = id;
                global.Fn.DownLoadFile({
                    url: grid.config.operator.del.url,
                    data: data
                });
            }
        },
        del: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">删除</a>' },
        copy: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">复制</a>' },
        edit: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">编辑</a>' },
        view: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">查看</a>' },
    };

    this.config = $.extend(true, {}, defaultConfig, tableConfig);
    InitConfig(this.config);

    function InitConfig(config) {
        if (!config.outOperator.del.url) {
            delete [config.outOperator.del];
        }

        if (config.operator) {
            for (var opType in config.operator) {
                if (config.operator[opType] && buttons[opType]) {
                    config.operator[opType] = $.extend(true, buttons[opType], config.operator[opType]);
                }
            }
        }
    }

    this.pagedData = {};
};
PagedDataTable.prototype = {
    //生成表单头部
    _GenerateTableHead: function () {
        var cur = this;
        var arrTable = [];
        arrTable.push(' <thead><tr>');
        if (cur.config.pagination.rownumber) {
            arrTable.push('<th class="text-center datagrid-rownumber">行号</th>');
        }
        if (cur.config.pagination.singleSelect === true) {
            arrTable.push('<th class="text-center datagrid-radio"><input disabled="disabled" type="radio"/></th>');
        }
        else if (cur.config.pagination.singleSelect === false) {
            arrTable.push('<th class="text-center datagrid-checkbox"><input data-role="datagrid-checkAll" type="checkbox"/></th>');
        }
        cur.config.columns.forEach(function (item) {
            arrTable.push('<th data-field="' + item['column'] + '" class="' + (item['className'] || "text-left") + '">' + item['title'] + '</th>');
        });
        if (cur.config.operator) {
            arrTable.push('<th class="text-center">操作</th>');
        }
        arrTable.push('</tr></thead>');
        return arrTable.join('');
    },
    _GenerateTableBody: function (arrData) {
        var cur = this;
        var arrTable = [];
        var primaryKey = cur.config.table.keyName;
        if (arrData && arrData.length > 0) {
            //foreach page data
            arrData.forEach(function (itemData, index) {
                var guid = itemData[primaryKey];
                arrTable.push('<tr>');
                if (cur.config.pagination.rownumber) {
                    arrTable.push('<td class="text-center datagrid-rownumber">' + ((index + 1) + (cur.config.pagination.pageIndex - 1) * cur.config.pagination.pageSize) + '</td>');
                }
                if (cur.config.pagination.singleSelect === true) {
                    arrTable.push('<td class="text-center"><input data-role="datagrid-radio" value="' + itemData[cur.config['table']['keyName']] + '" name="datagrid-radio" type="radio"/></td>');
                }
                else if (cur.config.pagination.singleSelect === false) {
                    arrTable.push('<td class="text-center"><input data-role="datagrid-check" value="' + itemData[cur.config['table']['keyName']] + '" type="checkbox"/></td>');
                }
                else {
                    //other 
                }
                cur.config.columns.forEach(function (item) {
                    arrTable.push('<td class="' + (item['className'] || 'text-left') + '">');
                    arrTable.push((item['formatter'] && item['formatter'](itemData[item['column']], item['source'] || itemData)) || itemData[item['column']]);
                    arrTable.push('</td>');
                });
                if (cur.config.operator) {
                    arrTable.push('<td class="text-center datagrid-op">');

                    for (var key in cur.config.operator) {
                        var opConfig = cur.config.operator[key];
                        if (opConfig) {
                            if (opConfig.formatter) {
                                arrTable.push(opConfig.formatter(itemData));
                            }
                            else {
                                var btnHTML = '';
                                if (opConfig['ajax'] === true) {
                                    btnHTML = opConfig['html'].replace(/\{id\}/, guid);
                                }
                                else {
                                    var concatStr = opConfig['url'].indexOf("?") != -1 ? "&" : "?";
                                    var url = opConfig['url'] + concatStr + primaryKey + "=" + guid;
                                    btnHTML = opConfig['html'].replace(/\{href\}/, url);
                                }
                                arrTable.push(btnHTML);
                            }
                        }
                    }
                    arrTable.push('</td>');
                }
                arrTable.push('</tr>');
            });
        }
        else {
            var dynamicColumn = (cur.config.pagination.rownumber ? 1 : 0) + (cur.config.pagination.operator ? 1 : 0) + (cur.config.pagination.singleSelect != null ? 1 : 0);
            arrTable.push('<tr><td class="text-center" colspan="' + (cur.config.columns.length + dynamicColumn) + '">暂无记录！</td></tr>');
        }
        return arrTable.join('');
    },
    GenerateTableFRM: function () {
        var cur = this;
        var $table = $('<table class="paged-data-table ' + cur.config['table']['className'] + '">');
        $table.append($(cur._GenerateTableHead()));
        $table.append("<tbody />");
        return $table
    },
    GeneratePageBar: function (totalNumber) {
        var cur = this;
        var pagingHTML = [];
        var total_page = Math.ceil(totalNumber / cur.config.pagination.pageSize);
        pagingHTML.push(' <div class="col-sm-7 pull-left text-left">');
        pagingHTML.push(' <ul id="pagination" class="pagination pagination-margin">');
        var curPageIndex = cur.config.pagination.pageIndex
        if (total_page > 0) {
            if (curPageIndex == 1) {
                pagingHTML.push("<li ><a>&lt;|</a></li>");
                pagingHTML.push("<li ><a>&lt;</a></li>");
            }
            else {
                pagingHTML.push("<li data-page='1'><a>&lt;|</a></li>");
                pagingHTML.push("<li data-page='" + (curPageIndex - 1) + "'><a>&lt;</a></li>");
            }
            //var endpage = (curPageIndex + 5) > total_page ? total_page : (curPageIndex + 5);
            //var startPage = (curPageIndex - 5) > 0 ? (curPageIndex - 5) : 1;
            //for (var i = startPage; i <= endpage ; i++) {
            //    if (curPageIndex == i) {
            //        pagingHTML.push("<li class='active'><span>" + i + "</span></li>");
            //    } else {
            //        pagingHTML.push("<li data-page='" + i + "'><a><span>" + i + "</span></a></li>");
            //    }
            //}

            for (var i = 1; i <= total_page; i++) {
                if (curPageIndex == i) {
                    pagingHTML.push("<li class='active'><span>" + i + "</span></li>");
                }
                else if (Math.abs(i - curPageIndex) <= 2) {
                    pagingHTML.push("<li data-page='" + i + "'><a><span>" + i + "</span></a></li>");
                }
            }

            if (total_page > curPageIndex) {
                pagingHTML.push("<li data-page='" + (curPageIndex + 1) + "'><a>&gt;</a></li>");
                pagingHTML.push("<li data-page='" + total_page + "'><a>&gt;|</a></li>");
            }
            else {
                pagingHTML.push("<li><a>&gt;</a></li>");
                pagingHTML.push("<li><a>&gt;|</a></li>");
            }
        }
        pagingHTML.push(' </ul>');
        pagingHTML.push(' </div>');
        //汇总分页
        pagingHTML.push('<div id="paginationTxt" class="col-sm-5 pull-right text-right">');
        pagingHTML.push(curPageIndex + " / " + total_page + " 页  (共 " + totalNumber + " 条记录)");
        pagingHTML.push(' </div>');
        return pagingHTML.join('');
    },
    _GeneratePageBarFRM: function () {
        var cur = this;
        var pagingHTML = [];
        pagingHTML.push('<div id="pager-bar-container" class="row">');
        pagingHTML.push(' </div>');
        var $pageBar = $(pagingHTML.join(''));
        return $pageBar;
    },
    GetData: function (searchData) {
        var cur = this;
        cur.config.pagination.queryParameter = $.extend(true, {}, cur.config.pagination.queryParameter, {
            //pageIndex: cur.config.pagination.pageIndex,
            pageNum: cur.config.pagination.pageIndex,
            pageSize: cur.config.pagination.pageSize
        }, searchData);
        var deffer = $.Deferred();
        $.ajax({
            url: cur.config.pagination.url,
            type: cur.config.pagination.method,
            data: cur.config.pagination.queryParameter,
            dataType: 'json',
            success: function (data) {
                if (cur.config.pagination.successCallBack) {
                    cur.pagedData = cur.config.pagination.successCallBack(data);
                }
                else {
                    cur.pagedData = data;
                }
                deffer.resolve();
            }
        });
        return deffer.promise();
    },
    /*===========查询数据源中选中的(数据|数据列|主键ID)
     * key：(false|true|'列名'),false:获取选中数据的数据源，true：获取选中数据的主键id列，'列名':获取数据源中指定的列
     * return Array|{}|'' 如果当前配置是允许多选，则返回数组，否则返回单条记录
     */
    GetChecked: function (key) {
        var cur = this;
        var $container = global.Fn.$(cur.config.table.container);
        if (cur.config.pagination.singleSelect === true) {
            var $checkeds = $($(':radio[data-role="datagrid-radio"]:checked'), $container);
            var ckData;
            if (key === true) { //查询主键列
                ckData = ($checkeds[0] && $checkeds[0].value);
            }
            else {
                cur.GetPagedData().some(function (item) {
                    if (item[cur.config.table.keyName] == ($checkeds[0] && $checkeds[0].value)) {
                        ckData = item[key] || item;
                        return true;
                    }
                })
            }
            return ckData;
        }
        else {
            var checkedValue = [];
            var $checkeds = $($(':checkbox[data-role="datagrid-check"]:checked'), $container);
            if ($checkeds.length > 0) {
                $.each($checkeds, function (index, ck) {
                    var ckData;
                    if (key === true) { //查询主键列
                        ckData = ck.value;
                    }
                    else {
                        cur.GetPagedData().some(function (item) {
                            if (item[cur.config.table.keyName] == ck.value) {
                                ckData = item[key] || item;
                                return true;
                            }
                        })
                    }
                    checkedValue.push(ckData);
                })
            }
            return checkedValue
        }
    },
    /*==========获取当前页面的数据
    return 当前页面的数据源 array
    */
    GetPagedData: function () {
        var cur = this;
        return cur.pagedData.info.result_list || [];
    },
    Render: function () {
        var cur = this;
        var $container = global.Fn.$(cur.config.table.container);
        var $table = cur.GenerateTableFRM();

        if (cur.config.pagination.autoLoad) {
            cur.Search();
        }
        else {
            $table.append($(cur._GenerateTableBody([])));
        }
        var $pageBarContainer = cur._GeneratePageBarFRM();
        global.Fn.$(cur.config.table.container).append($table).append($pageBarContainer);

        var operatorConfig = cur.config.outOperator;
        if (operatorConfig.search) {
            //查询
            global.Fn.$(operatorConfig.search.targetId).bind('click', function () {
                cur.Search();
            });
            //重置
            global.Fn.$(operatorConfig.search.resetId).bind('click', function () {
                global.Fn.$(operatorConfig.search.form)[0].reset();
            });
        }
        //删除
        if (operatorConfig.del) {
            var $del = global.Fn.$(operatorConfig.del.targetId);
            $del.bind('click', function () {
                $del.attr('disabled', true);
                var checkedIds = cur.GetChecked(true);
                var delData = {};
                delData[cur.config.outOperator.del.primaryKey || cur.config.table.keyName] = $.type(checkedIds) === 'array' ? checkedIds.join(',') : checkedIds;

                if (delData[cur.config.outOperator.del.primaryKey || cur.config.table.keyName]) {
                    $.ajax({
                        url: operatorConfig.del.url,
                        type: operatorConfig.del.method,
                        data: delData,
                        dataType: 'json',
                        success: function (data) {
                            $del.removeAttr('disabled');
                            if (data.code == "200") {
                                cur.Search();
                            }
                        }
                    });
                }
                else {
                    $del.removeAttr('disabled');
                    global.Fn.ShowMsg({
                        type: 'alert:error',
                        msg: '请先选择一条记录！'
                    });
                }
            });
        }

        //下载
        if (operatorConfig.download) {
            var $download = global.Fn.$(operatorConfig.download.targetId);
            $download.bind('click', function () {
                $download.attr('disabled', true);
                var checkedIds = cur.GetChecked(true);
                var downData = {};
                downData[cur.config.outOperator.download.primaryKey || cur.config.table.keyName] = $.type(checkedIds) === 'array' ? checkedIds.join(',') : checkedIds;

                if (downData[cur.config.outOperator.download.primaryKey || cur.config.table.keyName]) {
                    global.Fn.DownLoadFile({
                        url: cur.config.outOperator.download.url,
                        data: downData
                    });
                }
                else {
                    $download.removeAttr('disabled');
                    global.Fn.ShowMsg({
                        type: 'alert:error',
                        msg: '请先选择一条记录！'
                    });
                }
            });
        }

        //点击行选中
        if (cur.config.table.selectOnCheck) {
            $('#' + cur.config.table.container).on('click.datagrid', "tbody>tr", function (e) {
                var $clickTarget = $('input[data-role^="datagrid-"]', $(this));
                //执行ajax操作的指定function
                var $target = $(e.target);
                //忽略掉系统选择框和操作按钮
                if ($target.data('role') !== $clickTarget.data('role') && $target.data('select') !== false) {
                    $clickTarget.trigger('click');
                    event.preventDefault()
                }
            });
        }

        //操作按钮如：copy、del
        $('#' + cur.config.table.container).on('click.opbutton', '.btn[data-op]', function () {
            var $target = $(this);
            var opType = $target.data('op');
            if (opType) {
                cur.config.operator[opType]['handle']($target.data('id'), cur, $target);
            }
        })

        //分页事件
        $("#pager-bar-container").on('click', 'li', function (event) {
            var pageIndex = $(this).data('page');
            if (pageIndex) {
                cur.config.pagination.pageIndex = parseInt(pageIndex);
                cur.Search();
            }
        });

        //全选功能
        $($(':checkbox[data-role="datagrid-checkAll"]'), $container).bind('click', function () {
            var $that = $(this);
            $that.closest("table").find("tbody>tr>td>input[data-role='datagrid-check']").prop('checked', $that.prop('checked'));
        });
        return cur;
    },
    Search: function () {
        var cur = this;
        var searchConfig = cur.config.outOperator.search;
        var postData = global.Fn.serializeJson(global.Fn.$(searchConfig.form));
        //处理post的数据
        if (searchConfig.beforeSearch) {
            postData = searchConfig.beforeSearch(postData);
        }
        $.when(cur.GetData(postData)).done(function () {
            var data = cur.pagedData;
            var $container = global.Fn.$(cur.config.table.container);
            if (data && data.code == '200') {
                var pagedData = data['info'];
                //如果当前页面大于1而且没数据，则查询第一页
                if (pagedData.result_list.length == 0 && cur.config.pagination.pageIndex > 1) {
                    cur.config.pagination.pageIndex = 1;
                    cur.Search();
                }
                var tbodyHtml = cur._GenerateTableBody(pagedData.result_list);
                var pageBar = cur.GeneratePageBar(pagedData.total);
                $('#' + cur.config.table.container + " table>tbody").html(tbodyHtml);
                $("#pager-bar-container", $container).html(pageBar);
            }
            else {
                var tbodyHtml = cur._GenerateTableBody([]);
                $('#' + cur.config.table.container + " table>tbody").html(tbodyHtml);
                console.log("分页查询出错:" + data);
            }
        }).fail(function (data) { console.error('数据接口出错！') });
    },
};



/*===========================
options:{
    config:{
        autoLayout:[bool:'1,2,1,2,1,2'], //true:将自动根据列来布局，false：将按照默认(2,4) '1,2,1,2'：手动控制列
    }, 
    hides:[ //隐藏列
        {id:'',name:''}
    ],
    eles:[
        render:'',//优先级最高，使用此html,如：<div class="form-group"></div>
        label:{target:'#contain.id',className:'col-sm-2',text:'#contain.title'},
        ele:{
            prev:{type:'button',iconClassName:'',ele{render:''}},
            next:{},
            id:'',name:'',className:'col-sm-4',readonly:false,disable:false,value:'',type:'',extendAttr:{key:value},required:false,
            render:'',pre:{},next:{}
        } 
        //withNull:仅在select时有效果
        //items：仅在select、radio、checkbox时有效
        //selectContainClass:仅在radio、checkbox、datetime时有效，用于radio、checkbox外层的样式(默认：radio|checkbox-inline、input-group)   
        //render：优先级比其他属性高，相当于生成改元素的源码
        //pre,next:{}用于配置前后的input-group-addon
    ],
    eles:{
        groupName:{arr:[....]}
    }
}
===========================*/
function BSForm(eleConfigs) {
    //默认配置
    var defaultClass = {
        labelClassName: 'col-sm-2',//默认label样式
        colClassName: ' col-sm-4',//默认label后面的div样式
        formControlClassName: 'form-control',//默认表单元素样式
        inputGroupClassName: 'input-group',
        autoLayout: {
            '1': { label: 'col-sm-2', colClassName: 'col-sm-10' },
            '2': { label: 'col-sm-2', colClassName: 'col-sm-4' },
            '3': { label: 'col-sm-1', colClassName: 'col-sm-3' },
            '4': { label: 'col-sm-1', colClassName: 'col-sm-2' },
            '6': { label: 'col-sm-1', colClassName: 'col-sm-1' },
            'n': { label: 'col-sm-', colClassName: 'col-sm-' }
        }
    };
    //一些默认配置
    this.defaultConfig = {
        select: '<select>',
        nullSelectOption: '<option>--请选择--</option>',
        text: '<input type="text" />',
        file: '<input type="file"/>',
        search: '<input type="text" />',
        textarea: '<textarea>',
        radio: '<input type="radio" />',
        checkbox: '<input type="checkbox" />',
        label: '<label class="control-label" />',
        datetime: '<input type="text" class="date-picker"/>'
    };


    this.config = $.extend(true, { autoLayout: false, hides: false }, eleConfigs);
    InitHidesConfig(this.config['hides']);
    //单个分组
    if ($.type(this.config.eles) === 'array') {
        InitElesConfig(this.config['eles']);
    }
    else {
        for (var key in this.config.eles) {
            InitElesConfig(this.config['eles'][key]);
        }
    }

    //console.log(JSON.stringify(this.config));
    //如果json中指定的key不存在值，则设置一个默认值
    function setKeyValue(json, key, defaultValue) {
        json[key] = json[key] || defaultValue;
    }
    //根据配置规则完善规则
    //itemCount 改组的条数
    function setItemDefaultConfig(config, itemCount, index) {
        var label = config['label'], ele = config['ele'];
        if (!label && !ele) { return; }
        var autoLayout = eleConfigs.autoLayout;
        /*#region label的配置*/
        if (label !== false) {//如果配置了false，则表示不生成label
            label = label || {};
            setKeyValue(label, 'target', label.target || ele.id || ele.name || '');//使用配置的或者管理的表单的id
            if ($.type(autoLayout) === 'string') {
                var layoutColumn = autoLayout.split(',');
                setKeyValue(label, 'className', defaultClass.autoLayout['n'].label + (layoutColumn[2 * index] || layoutColumn[0]));
            }
            else if (autoLayout === true && itemCount > 1) {
                setKeyValue(label, 'className', defaultClass.autoLayout[itemCount].label);//使用配置的或者默认的
            }
            else {
                setKeyValue(label, 'className', defaultClass.labelClassName);//使用配置的或者默认的
            }
            setKeyValue(label, 'text', ele.title || false);//使用配置的或者默认的
            setKeyValue(label, 'required', ele.required || false);//使用配置的或者默认的
            config['label'] = label;
        }
        /*#endregion*/

        /*#region form element 的配置*/
        if (ele.type === 'checkbox' || ele.type === 'radio') {
            setKeyValue(ele, 'selectContainClass', ele.selectContainClass || ele.type + '-inline');
            if (ele.type === 'radio') {
                ele.items.forEach(function (radioItem) {
                    radioItem['name'] = ele.name || ele.id;
                })
            }
        }
        else {
            if (ele.type === undefined) {
                ele.type = 'text';
            }
            else if (ele.type === 'datetime' && !ele.next) {
                // setKeyValue(ele, 'selectContainClass', ele.selectContainClass || defaultClass.inputGroupClassName);
                setKeyValue(ele, 'next', { type: 'button', disabled: ele.disabled, buttonClassName: 'btn btn-default', iconClassName: 'glyphicon glyphicon-calendar' })
            }
            else if (ele.type === 'search' && !ele.next) {
                setKeyValue(ele, 'next', { type: 'button', disabled: ele.disabled, buttonClassName: 'btn btn-default', iconClassName: 'glyphicon glyphicon-search' })
            }
            else if (ele.type === 'textarea') {
                setKeyValue(ele, 'rows', ele.rows || 2);
            }
            setKeyValue(ele, 'className', (ele.className || '') + defaultClass.formControlClassName);
            setKeyValue(ele, 'id', ele.id || ele.name || false);
            setKeyValue(ele, 'name', ele.name || ele.id || false);
        }
        setKeyValue(ele, 'value', ele.value || false);

        //布局相关默认配置
        if ($.type(autoLayout) === 'string') {
            var layoutColumn = autoLayout.split(',');
            setKeyValue(ele, 'parentClassName', defaultClass.autoLayout['n'].colClassName + (layoutColumn[2 * index + 1] || layoutColumn[1]));
        }
        else if (autoLayout === true && itemCount > 1) {
            setKeyValue(ele, 'parentClassName', defaultClass.autoLayout[itemCount].colClassName);//使用配置的或者默认的
        }
        else {
            setKeyValue(ele, 'parentClassName', ele.parentClassName || defaultClass.colClassName);//使用配置的或者默认的
        }

        config['ele'] = ele;
        /*#endregion*/
    }
    //设置单个form-group的默认配置项值
    function InitElesConfig(eleConfigs) {
        if (eleConfigs && eleConfigs.length > 0) {
            for (var i = 0, len = eleConfigs.length; i < len; i++) {
                if ($.type(eleConfigs[i]) === 'array') {
                    for (var j = 0, sLen = eleConfigs[i].length; j < sLen; j++) {
                        setItemDefaultConfig(eleConfigs[i][j], sLen, j);
                    }
                }
                else {
                    setItemDefaultConfig(eleConfigs[i]);
                }
            }
        }
        return eleConfigs;
    }
    function InitHidesConfig(hideConfig) {
        if (hideConfig && hideConfig.length > 0) {
            hideConfig.forEach(function (item) {
                item['id'] = item['id'] || item['name'];
                item['name'] = item['name'] || item['id'];
            });
        }
        return hideConfig;
    }
};
BSForm.prototype = {
    //存放当前容器ID
    containerID: '',
    /*=================
     * 根据配置为指定jquery元素添加data-属性
     * $target:目标元素
     * dataExtendAttribute:{role:'page'}==>data-role:'page'
     * return this;
     */
    _SetDataAttribute: function ($target, dataExtendAttribute) {
        var cur = this;
        if (dataExtendAttribute) {
            for (var key in dataExtendAttribute) {
                //$target.data(key, dataExtendAttribute[key]);
                $target.attr('data-' + key, dataExtendAttribute[key]);
            }
        }
        return cur;
    },
    /*=====================
     * 为指定元素设置指定的属性值
     * $formGroup:要设置的表单元素
     * attr:要设置的属性
     * attrValue:属性值
     * removeInvalidAttr:属性值为false时不添加该属性
     * return this;
     */
    _SetElementAttribute: function ($target, attr, attrValue, removeInvalidAttr) {
        var cur = this;
        //判断是否移除无效属性
        if (removeInvalidAttr === false || !!attrValue) {
            $target.attr(attr, attrValue);
        }
        return cur;
    },
    /*====================
     * 生成Label到指定formgroup中
     * $formGroup:目标formgroup
     * labelConfig：label:{target:'',className:'',text:'',required:bool}
     * return this;
     */
    _GenerateLabelToGormGroup: function ($formGroup, labelConfig) {
        var cur = this;
        var $label = $(cur.defaultConfig.label);
        if (labelConfig !== false) {
            cur._SetElementAttribute($label, 'for', labelConfig.target, false);
            $label.addClass(labelConfig.className || '');
            $label.text(labelConfig.text || '');
            //设置label前的是否必填
            if (labelConfig.required) {
                $label.prepend($('<span class="symbol required"></span>'));
            }
            $formGroup.append($label);
        }
        return cur;
    },
    /*==============生成input-group-addon到input-group
    *$inputGroup    :$  容器
    *addonConfig     :{iconClass: 'glyphicon glyphicon-calendar', text: '',type:''} span配置项目
    *return this
    */
    _GenerateInputGroupAddOn: function ($inputGroup, addonConfig) {
        var cur = this;
        var $contain = $('<span />');
        if (addonConfig.type === 'button') {
            $contain.addClass("input-group-btn");
            var $btn = $('<button class="btn" type="button">');
            $btn.addClass(addonConfig.buttonClassName || 'btn-default');
            if (addonConfig.iconClassName) {
                var $i = $('<i class="' + addonConfig.iconClassName + '" />');
                $btn.append($i);
            }

            if (addonConfig.disabled) {
                cur._SetElementAttribute($btn, 'disabled', addonConfig.disabled, true);
                $contain.addClass('disabled');
            }

            $btn.append(addonConfig.text || '');
            $contain.append($btn);
        }
        else {
            $contain.addClass("input-group-addon");
            if (addonConfig.ele) {
                $contain.append($(addonConfig.ele.render));
            }
            if (addonConfig.iconClassName) {
                var $i = $('<i class="' + addonConfig.iconClassName + '" />');
                $contain.append($i);
            }
            $contain.append(addonConfig.text || '');
        }
        $inputGroup.append($contain);
        return cur;
    },
    /*===========================
    value:配置的item项
    ===========================*/
    /*===========================
    *根据配置生成表单元素内容<div class="col-sm-n"></div>里面的内容
    * $target:目标元素
    * formEleConfig:表单配置
    * return this;
    ===========================*/
    _GenerateFormElement: function ($target, eleConfig) {
        var cur = this;
        if (eleConfig.render) {
            $target.append($(eleConfig.render));
            return cur;
        }
        var feType = eleConfig.type;
        //存放表单元素
        var $selector = $(cur.defaultConfig[feType]);

        if (feType === "select") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);

            //添加请选择列
            if (eleConfig.withNull) {
                $selector.append($(cur.defaultConfig.nullSelectOption));
            }
            eleConfig.items.forEach(function (item, index, arr) {
                var $ele = $('<option>');
                cur._SetElementAttribute($ele, 'value', item.value, false);
                cur._SetElementAttribute($ele, 'selected', item.selected, true);
                $ele.text(item.text || '');
                $selector.append($ele);
            });
            $target.append($selector);
        }
        else if (feType === "text" || feType === "datetime" || feType === "search") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);
            //设置value的值
            cur._SetElementAttribute($selector, 'value', eleConfig.value, true);
            $target.append($selector);
        }
        else if (feType === "file") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);
            //设置value的值
            cur._SetElementAttribute($selector, 'value', eleConfig.value, true);

            //str += '<table>';
            //str += '<tr id="image-row0">';
            //str += '<td class="text-left">';
            //str += '<input type="file" name="files" ' + type + ' id="fileupload_input"/>';
            //str += '<input class="upFileBtn" type="button" onclick="document.getElementById(\'fileupload_input\').click()" />';
            //str += '<br/>';
            //str += '<span id="buttonfield"></span>';
            //str += '</td>';
            //str += '</tr>';
            //str += '</table>';
            $table = $('<table>');
            $tr = $('<tr/>');
            $td = $('<td/>');

            $td.append($selector);
            $td.append($('<input class="upFileBtn" type="button" onclick="document.getElementById(\'' + eleConfig.id + '\').click()" /><br/><span id="buttonfield"></span>'));

            $tr.append($td);
            $table.append($tr)
            $target.append($table);
        }
        else if (feType === "textarea") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);
            //设置value的值
            cur._SetElementAttribute($selector, 'rows', eleConfig.rows, true);
            cur._SetElementAttribute($selector, 'cols', eleConfig.cols, true);
            $selector.text(eleConfig.value);
            $target.append($selector);
        }
        else if (feType === "radio") {
            eleConfig.items.forEach(function (item, index, arr) {
                var $radioContain = $('<label>');
                $radioContain.addClass(eleConfig.selectContainClass);

                var $radio = $(cur.defaultConfig[feType]);
                //设置id、class、name及data-扩展属性
                _SetCommentAttr($radio, eleConfig);
                //设置value的值
                cur._SetElementAttribute($radio, 'value', item.value, true);

                $radioContain.append($radio);
                $radioContain.append(document.createTextNode(item.text));
                $target.append($radioContain);
            });
        }
        else if (feType === "checkbox") {
            eleConfig.items.forEach(function (item, index, arr) {
                var $radioContain = $('<label>');
                $radioContain.addClass(eleConfig.selectContainClass);

                var $checkbox = $(cur.defaultConfig[feType]);
                //设置id、class、name及data-扩展属性
                _SetCommentAttr($checkbox, eleConfig);
                //设置value的值
                cur._SetElementAttribute($checkbox, 'value', item.value, true);

                $radioContain.append($checkbox);
                $radioContain.append(document.createTextNode(item.text));
                $target.append($radioContain);
            });
        }
            //else if (feType === "datetime") {
            //    var $divInputGroup = $('<div>');
            //    $divInputGroup.addClass(eleConfig.selectContainClass);
            //    //设置id、class、name及data-扩展属性
            //    _SetCommentAttr($selector, eleConfig);
            //    //设置value的值
            //    cur._SetElementAttribute($selector, 'value', eleConfig.value, true);
            //    $divInputGroup.append($selector);
            //    //添加后面的提示图标
            //    $divInputGroup.append($(cur.defaultConfig.dateTimeAddOn));
            //    $target.append($divInputGroup);
            //}
        else {
            console.error("表单插件不支持此类型：" + feType);
        }
        return cur;

        ///设置一些通用属性(id,name,class,data-)
        function _SetCommentAttr($target, eleConfig) {
            cur._SetElementAttribute($target, 'id', eleConfig.id, true);
            cur._SetElementAttribute($target, 'name', eleConfig.name, true);
            cur._SetElementAttribute($target, 'readonly', eleConfig.readonly, true);
            cur._SetElementAttribute($target, 'disabled', eleConfig.disabled, true);
            //if ($target.hasAttribute('class') == false) {
            //    cur._SetElementAttribute($target, 'class', eleConfig.className, true);
            //}
            //else {
            $target.addClass(eleConfig.className);
            //}
            cur._SetDataAttribute($target, eleConfig.extendAttr);
        }
    },
    /*===========================
    value:配置的item项
    ===========================*/
    /*===========================
    *根据配置生成input-group及元素前|后的input-group-addon
    * $colSM    :$  目标元素
    * eleConfig :[]    元素的配置
    * return this;
    ===========================*/
    _GenerateImputGroup: function ($colSM, eleConfig) {
        var cur = this;
        var $inputGroup;
        if (eleConfig.pre || eleConfig.next) {
            $inputGroup = $('<div class="input-group"/>');
            if (eleConfig.pre) {
                cur._GenerateInputGroupAddOn($inputGroup, eleConfig.pre);
            }
            cur._GenerateFormElement($inputGroup, eleConfig);
            if (eleConfig.next) {
                cur._GenerateInputGroupAddOn($inputGroup, eleConfig.next);
            }
            $colSM.append($inputGroup);
        }
        else {
            cur._GenerateFormElement($colSM, eleConfig);
        }

        return cur;
    },
    /*===================
     * 根据配置生成表单外层labe和div.col-sm-n
     * $formGroup:最外层的div.form-group
     * itemConfig:针对item的配置节点
     */
    _GenerateColSM: function ($formGroup, itemConfig) {
        var cur = this;
        if (itemConfig.render) {
            $formGroup.append($(itemConfig.render));
            return cur;
        }
        if (!itemConfig.label && !itemConfig.ele) {
            return cur;
        }
        cur._GenerateLabelToGormGroup($formGroup, itemConfig['label']);
        //生成.col-sm-n
        var $col = $('<div />');
        $col.addClass(itemConfig.ele.parentClassName);
        //生成.col-sm-n 里面的内容(input-group或者表单元素)
        cur._GenerateImputGroup($col, itemConfig.ele);
        $formGroup.append($col);
        return cur;
    },
    /*============生成hide元素
    *containerID    :''    容器
    *hideConfig     :Array   隐藏表单元素配置列
    *return this;
    */
    _RenderHideEle: function (containerID, hideConfig) {
        var cur = this;
        if (hideConfig && hideConfig.length > 0) {
            var $contain = global.Fn.$(containerID);
            hideConfig.forEach(function (item) {
                var $hide = $('<input type="hidden"/>');
                $hide.attr("id", item.id).attr('name', item.name).attr('value', item.value);
                $contain.append($hide);
            });
        }
        return cur;
    },
    /*====================根据配置项生成可见表单元素
    *containerID：'' 容器id
    *visibleConfig  :[]|{}  可见元素配置项
    */
    _RenderVisibleEle: function (containerID, visibleConfig) {
        var cur = this;
        var $contain = global.Fn.$(containerID);
        //定义一个存放生成的表单的容器，考虑性能原因，用临时div存储生成的form-group
        var $formContent = $('<div/>');
        $.each(visibleConfig, function (index, value) {
            var $formGroup = $('<div class="form-group"/>');
            //单项
            if (!value.length) {
                cur._GenerateColSM($formGroup, value);
            }
            else {
                $.each(value, function (index, value1) {
                    cur._GenerateColSM($formGroup, value1);
                });
            }
            $formContent.append($formGroup);
        });
        $contain.append($formContent.html());
        return cur;
    },
    /*=================将model绑定到form表单中
     * model:要绑定的model json
     */
    InitFormData: function (model) {
        var cur = this;
        if (!model) { return cur; }

        var elesConfig = cur.config.eles;
        var hides = cur.config.hides;
        var $form = global.Fn.$(cur.containerID);
        //分组form
        if ($.type(elesConfig) === 'object') {
            for (var key in elesConfig) {
                //eles
                elesConfig[key].forEach(function (config, index, arr) {
                    if ($.type(config) == 'array') {
                        config.forEach(function (sConfig) {
                            SetDefaultValue(sConfig, model);
                        })
                    }
                    else {
                        SetDefaultValue(config, model);
                    }
                });
            }
        }
        else if ($.type(elesConfig) === 'array') {
            //eles
            elesConfig.forEach(function (config, index, arr) {
                if ($.type(config) == 'array') {
                    config.forEach(function (sConfig) {
                        SetDefaultValue(sConfig, model);
                    })
                }
                else {
                    SetDefaultValue(config, model);
                }
            });
            function SetDefaultValue(eleConfig, model) {
                var ele = eleConfig['ele'];
                if (eleConfig && ele && ele['id']) {
                    var key = ele['id'];
                    if (key !== undefined && model[key] !== undefined) {
                        ele['value'] = model[key];
                    }
                }
            }
        }
        else {
            throw "表单配置列为空";
        }
        if (hides && hides.length > 0) {
            //hides
            hides.forEach(function (config) {
                if (model[config.id] !== undefined) {
                    $("#" + config.id, global.Fn.$(cur.containerID)).val(model[config.id]);
                }
            });
        }
        return cur;

        function SetDefaultValue(eleConfig, model) {
            var ele = eleConfig['ele'];
            if (eleConfig && ele && ele['name']) {
                var key = ele['name'];
                var eleValue = model[key];
                if (key !== undefined && eleValue !== undefined) {
                    if (ele['type'] === 'text' || ele['type'] === 'select' || ele['type'] === 'datetime' || ele['type'] === 'search' || ele['type'] === 'textarea') {
                        $("#" + key, global.Fn.$(cur.containerID)).val(eleValue);
                    }
                    else if (ele['type'] === 'radio') {
                        $(":radio[name=" + key + "][value='" + eleValue + "']", $form).attr('checked', 'checked')
                    }
                    else if (ele['type'] === 'checkbox' && eleValue.length > 0) {
                        var $ckboxs = $(':checkbox[name="' + key + '"]', $form);
                        $ckboxs.each(function (index, item) {
                            if (eleValue.some(function (ev) { return ev == item.value })) {
                                $(item).attr('checked', 'checked');
                            }
                            else {
                                $(item).removeAttr('checked');
                            }
                        });
                    }
                }
            }
        }
    },
    /*=====================
    container:'',
    callBack:function(){}
    =====================*/
    Render: function (containerID, callBack) {
        var cur = this;
        cur.containerID = containerID;
        cur._RenderHideEle(containerID, cur.config.hides);
        var $container = global.Fn.$(containerID);
        //分组
        if ($.type(cur.config.eles) === 'object') {
            for (var key in cur.config.eles) {
                var $panel = $('<div class="panel panel-default" />');
                var $panelHead = $('<div class="panel-heading" />');
                $panelHead.append($('<h3 class="panel-title"><i class="fa fa-list"></i> ' + key + '</h3>'));
                var $panelBody = $('<div class="panel-body" />');
                cur._RenderVisibleEle($panelBody, cur.config['eles'][key]);
                $panel.append($panelHead);
                $panel.append($panelBody);
                $container.append($panel);
            }
        }
        else {
            cur._RenderVisibleEle(containerID, cur.config.eles);
        }
        if (typeof callBack == 'function') {
            callBack(cur);
        };
        return cur;
    },
    GetFormData: function () {
        var cur = this;
        return global.Fn.serializeJson(cur.containerID);
    }
};