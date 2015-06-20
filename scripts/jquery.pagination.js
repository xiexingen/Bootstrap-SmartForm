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
            sortable:false,
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
            sortColumn:[],//排序的列
            sortType:['desc'],//排序的类型
            multiSort: false,//是否允许多列排序
            queryParameter: {}, //查询的表单
            successCallBack: null// function (data) { return data;} //执行成功后的回调函数
            completeCallBack:null//渲染成功的后的操作
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
            pageSize: 10,
            pageList:[10,20,40,50,80,100,200,500,1000],
            sortColumn: [],//排序的列
            sortType: ['desc'],//排序的类型
            multiSort: false,//是否允许多列排序
            queryParameter: {}, //查询的表单
            successCallBack: null,// function (data) { return data;} //查询数据成功后的回调，用于对数据的处理
            completeCallBack: null,//显示到页面后的处理
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
        del: {
            html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">删除</a>'
        },
        copy: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">复制</a>' },
        edit: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">编辑</a>' },
        view: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">查看</a>' },
        gallery: { html: '<a data-select="false" href="{href}" class="btn btn-xs btn-primary">图库</a>' },
    };

    this.config = $.extend(true, {}, defaultConfig, tableConfig);
    InitConfig(this.config);

    function InitConfig(config) {
        //外部的删除
        if (!config.outOperator.del.url) {
            delete [config.outOperator.del];
        }
        //操作栏按钮
        if (config.operator) {
            for (var opType in config.operator) {
                if (config.operator[opType] && buttons[opType]) {
                    config.operator[opType] = $.extend(true, buttons[opType], config.operator[opType]);
                }
            }
        }

        //默认为主键倒序排序
        config.pagination.sortColumn[0] = config.table.keyName;
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
            var $th = $("<th />");
            $th.attr('data-field', item['column']);
            $th.addClass((item['className'] || 'text-center'));

            //如果配置了width，则使用嵌套div布局
            if (item['width']) {
                var $innerDiv = $('<div />');
                $innerDiv.width(item['width']);
                $innerDiv.text(item['title']);
                if (item['sortable']) {
                    $th.addClass('datagrid-sortable');
                    $innerDiv.append($('<i class="glyphicon datagrid-sort-ico"> </i>'));
                }
                $th.append($innerDiv);
            }
            else {
                $th.text(item['title']);
                if (item['sortable']) {
                    $th.addClass('datagrid-sortable');
                    $th.html($th.text() + '<i class="glyphicon datagrid-sort-ico"> </i>');
                }
            }
            arrTable.push($th.prop('outerHTML'));
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
                    var $td = $('<td />');
                    $td.addClass(item['className'] || 'text-left');
                    var tdText = (item['formatter'] && item['formatter'](itemData[item['column']], item['source'] || itemData)) || itemData[item['column']];
                    if (item['width']) {
                        var $innerDiv = $("<div>" + tdText + "</div>");
                        $innerDiv.attr('title',tdText);
                        $td.append($innerDiv.prop('outerHTML'));
                    }
                    else {
                        $td.html(tdText);
                    }
                    arrTable.push($td.prop('outerHTML'));
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
                                    var url = opConfig['url'] + concatStr + (cur.config.operator[key]['primaryKey'] || primaryKey) + "=" + guid;
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
            var dynamicColumn = (cur.config.pagination.rownumber ? 1 : 0) + (cur.config.operator ? 1 : 0) + (cur.config.pagination.singleSelect != null ? 1 : 0);
            arrTable.push('<tr><td class="text-center" colspan="' + (cur.config.columns.length + dynamicColumn) + '">暂无记录！</td></tr>');
        }
        return arrTable.join('');
    },
    _GeneratePageList: function (pageList) {
        var cur = this;
        var pageListHTML = [];
        pageListHTML.push('<div class="col-sm-1" style="padding:0;" >');
        pageListHTML.push('<select data-handle="page-list" class="form-control" >');
        pageList.forEach(function (value, index, arr) {
            pageListHTML.push('<option value="' + value+'" ');
            if (value == cur.config.pagination.pageSize) {
                pageListHTML.push(' selected="selected" ');
            }
            pageListHTML.push('>' + value + '</option>');
        });
        pageListHTML.push("</select>");
        pageListHTML.push('</div>');
        return pageListHTML.join('');
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
        pagingHTML.push(' <div class="col-sm-8 pull-left text-left">');

        pagingHTML.push(cur._GeneratePageList(cur.config.pagination.pageList));

        pagingHTML.push('<div class="col-sm-11">');
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
        pagingHTML.push(' </div>');
        //汇总分页
        pagingHTML.push('<div id="paginationTxt" class="col-sm-4 pull-right text-right">');
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
            pageSize: cur.config.pagination.pageSize,
            order: cur.config.pagination.sortColumn.join(','),
            sort: cur.config.pagination.sortType.join(','),
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
        //table 的config
        var tabConfig = cur.config.table;

        var $container = global.Fn.$(tabConfig.container);

        var $table = cur.GenerateTableFRM();

        if (cur.config.pagination.autoLoad) {
            cur.Search();
        }
        else {
            $table.append($(cur._GenerateTableBody([])));
        }
        var $pageBarContainer = cur._GeneratePageBarFRM();
        var $pageContainer = $('<div class="paged-table-container"></div>');
        $pageContainer.append($table);
        $container.append($pageContainer).append($pageBarContainer);

        var outConfig = cur.config.outOperator;
        if (outConfig.search) {
            //查询
            global.Fn.$(outConfig.search.targetId).bind('click', function () {
                cur.Search();
            });
            //重置
            global.Fn.$(outConfig.search.resetId).bind('click', function () {
                global.Fn.$(outConfig.search.form)[0].reset();
            });
        }
        //删除
        if (outConfig.del) {
            var $del = global.Fn.$(outConfig.del.targetId);
            $del.bind('click', function () {
                var checkedIds = cur.GetChecked(true);
                var delData = {};
                delData[cur.config.outOperator.del.primaryKey || tabConfig.keyName] = $.type(checkedIds) === 'array' ? checkedIds.join(',') : checkedIds;
                if (delData[cur.config.outOperator.del.primaryKey || tabConfig.keyName]) {
                    global.Fn.ShowMsg({
                        type: 'confirm:warning', msg: '确定要删除吗?', callback: function (result) {
                            if (result) {
                                $del.attr('disabled', true);
                                $.ajax({
                                    url: outConfig.del.url,
                                    type: outConfig.del.method,
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
                        }
                    })
                }
                else {
                    global.Fn.ShowMsg({
                        type: 'alert:error',
                        msg: '请先选择一条记录！'
                    });
                }
            });
        }

        //下载
        if (outConfig.download) {
            var $download = global.Fn.$(outConfig.download.targetId);
            $download.bind('click', function () {
                $download.attr('disabled', true);
                var checkedIds = cur.GetChecked(true);
                var downData = {};
                downData[cur.config.outOperator.download.primaryKey || tabConfig.keyName] = $.type(checkedIds) === 'array' ? checkedIds.join(',') : checkedIds;

                if (downData[cur.config.outOperator.download.primaryKey || tabConfig.keyName]) {
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
        if (tabConfig.selectOnCheck) {
            $container.on('click.datagrid', "tbody>tr", function (e) {
                var $clickTarget = $('input[data-role^="datagrid-"]', $(this));
                //执行ajax操作的指定function
                var $target = $(e.target);
                //忽略掉系统选择框和操作按钮
                if ($target.data('role') !== $clickTarget.data('role') && $target.data('select') !== false) {
                    $clickTarget.trigger('click');
                    e.preventDefault();
                }
            });
        }

        //操作按钮如：copy、del
        $container.on('click.opbutton', '.btn[data-op]', function () {
            var $target = $(this);
            var opType = $target.data('op');
            if (opType) {
                cur.config.operator[opType]['handle']($target.data('id'), cur, $target);
            }
        })

        //分页事件
        $pageBarContainer.on('click', 'li', function (event) {
            var pageIndex = $(this).data('page');
            if (pageIndex) {
                cur.config.pagination.pageIndex = parseInt(pageIndex);
                cur.Search();
            }
        }).on('change', 'select[data-handle="page-list"]', function (event) {
            var pageSize = $(this).val();
            cur.config.pagination.pageSize = pageSize;
            cur.Search();
        });

        //全选功能
        $($(':checkbox[data-role="datagrid-checkAll"]'), $container).bind('click', function () {
            var $that = $(this);
            $that.closest("table").find("tbody>tr>td>input[data-role='datagrid-check']").prop('checked', $that.prop('checked'));
        });

        //排序事件
        $container.on('click.datagrid_sort', 'table>thead>tr>th.datagrid-sortable', function () {
            var $this = $(this);
            var paginationConfig = cur.config.pagination;
            //var $sortICO = $this.find('i');
            var curField = $this.data('field');
            if (paginationConfig.multiSort) {
                var index = paginationConfig.sortColumn.indexOf(curField);
                if (index === -1) {
                    paginationConfig.sortColumn.push(curField);
                    paginationConfig.sortType.push('asc');
                }
                else {
                    paginationConfig.sortType[index] = (paginationConfig.sortType[index] === 'asc' ? 'desc' : 'asc');
                }
            }
            else {
                //非多排序，每次排序之前要清楚之前的排序里
                //$this.closest('tr').find('th').not($this).find('i').removeClass('glyphicon-chevron-down').removeClass('glyphicon-chevron-up');
                $this.closest('tr').find('th').not($this).removeClass('asc desc');
                if (paginationConfig.sortColumn[0] === curField) {
                    paginationConfig.sortType[0] = (paginationConfig.sortType[0] === 'asc' ? 'desc' : 'asc');
                }
                else {
                    paginationConfig.sortColumn[0] = curField;
                    paginationConfig.sortType[0] = 'asc';
                }
            }
            if ($this.hasClass('asc')) {
                $this.removeClass('asc').addClass('desc')
            }
            else if ($this.hasClass('desc')) {
                $this.removeClass('desc').addClass('asc')
            }
            else {
                $this.addClass('asc');
            }
            //if ($sortICO.hasClass('glyphicon-chevron-down')) {
            //    $sortICO.removeClass('glyphicon-chevron-down')
            //    $sortICO.addClass('glyphicon-chevron-up');
            //}
            //else if ($sortICO.hasClass('glyphicon-chevron-up')) {
            //    $sortICO.removeClass('glyphicon-chevron-up')
            //    $sortICO.addClass('glyphicon-chevron-down');
            //}
            //else {
            //    $sortICO.addClass('glyphicon-chevron-up');
            //}

            cur.Search();
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
            if (cur.config.pagination.completeCallBack) {
                cur.config.pagination.completeCallBack();
            }
        }).fail(function (data) { console.error('数据接口出错！') });
    },
};