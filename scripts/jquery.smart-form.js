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
        img:{name:'',multiple:'true',extendAttr:{handle:'single',url:'',filed:''}} //上传的键名、多选文件、是否单个显示、上传url、保存的时name名
        //withNull:仅在select时有效果
        //items：仅在select、radio、checkbox时有效
        //selectContainClass:仅在radio、checkbox、datetime时有效，用于radio、checkbox外层的样式(默认：radio|checkbox-inline、input-group)   
        //render：优先级比其他属性高，相当于生成改元素的源码
        //pre,next:{ele:{iconClass: 'glyphicon glyphicon-calendar', text: '',type:'',render:''}}用于配置前后的input-group-addon
    ],
    eles:{
        groupName:{arr:[....]}
    }
}
===========================*/
function BSForm(eleConfigs) {
    // #region Default Config

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
    var defaultConfig = {
        select: '<select>',
        nullSelectOption: '<option value="" >--请选择--</option>',
        text: '<input type="text" />',
        file: '<input type="file"/>',
        img: '<input type="file"/>',
        search: '<input type="text" />',
        textarea: '<textarea>',
        radio: '<input type="radio" />',
        checkbox: '<input type="checkbox" />',
        label: '<label class="control-label" />',
        datetime: '<input type="text" class="date-picker"/>'
    };

    // #endregion

    var exports = {
        containerID: '', //存放当前容器ID
    };

    exports.config = $.extend(true, { autoLayout: false, hides: false }, eleConfigs);
    /*=================将model绑定到form表单中
     * model:要绑定的model json
     */
    exports.InitFormData = function (model) {
        var cur = exports;
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
                        $("#" + key, global.Fn.$(cur.containerID)).val(eleValue || '');
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
                else if (ele['type'] === 'img') {
                    var imgKey = ele['extendAttr']['field'];
                    eleValue = model[imgKey];
                    if ($.type(eleValue) == 'string') {
                        eleValue = [eleValue];
                    }
                    var $ul = $(":file[data-field='" + ele['extendAttr']['field'] + "']", $form).closest('div').next('div.upload-list').find('ul');
                    eleValue.forEach(function (value, index) {
                        $ul.append('<li><img src="' + value + '"><span class="upload-item-remove glyphicon glyphicon-remove"></span><input name="' + ele['extendAttr']['field'] + '" type="hidden" value="' + value + '" /></li>');
                    });
                }
            }
        }
    };
    
    /*=================呈现页面
     * container:'',
     * callBack:function(){}
     */
    exports.Render = function (containerID, callBack) {
        var cur = exports;
        cur.containerID = containerID;
        _RenderHideEle(containerID, cur.config.hides);
        var $container = global.Fn.$(containerID);
        //分组
        if ($.type(cur.config.eles) === 'object') {
            for (var key in cur.config.eles) {
                var $panel = $('<div class="panel panel-default" />');
                var $panelHead = $('<div class="panel-heading" />');
                $panelHead.append($('<h3 class="panel-title"><i class="fa fa-list"></i> ' + key + '</h3>'));
                var $panelBody = $('<div class="panel-body" />');
                _RenderVisibleEle($panelBody, cur.config['eles'][key]);
                $panel.append($panelHead);
                $panel.append($panelBody);
                $container.append($panel);
            }
        }
        else {
            _RenderVisibleEle(containerID, cur.config.eles);
        }
        if (typeof callBack == 'function') {
            callBack(cur);
        };
        return cur;
    };

    /*===========获取表单数据
     * 
     */
    exports.GetFormData = function () {
        return global.Fn.serializeJson(exports.containerID);
    };


    InitConfig(exports.config);

    return exports;

    // #region Help Method

    function InitConfig(config) {
        InitHidesConfig(config['hides']);
        //单个分组
        if ($.type(config.eles) === 'array') {
            InitElesConfig(config['eles']);
        }
        else {
            for (var key in config.eles) {
                InitElesConfig(config['eles'][key]);
            }
        }
    }

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
            else if (ele.type === 'img') {
                setKeyValue(ele, 'parentClassName', ele.parentClassName || 'col-sm-10');
                if (!ele.extendAttr) {
                    ele.extendAttr = {};
                }
                setKeyValue(ele.extendAttr, 'handle', (ele.extendAttr['handle'] || 'single'));
                setKeyValue(ele.extendAttr, 'url', (ele.extendAttr['url'] || ''));
                setKeyValue(ele.extendAttr, 'field', (ele.extendAttr['field']));
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

    /*=================
    * 根据配置为指定jquery元素添加data-属性
    * $target:目标元素
    * dataExtendAttribute:{role:'page'}==>data-role:'page'
    * return this;
    */
    function _SetDataAttribute($target, dataExtendAttribute) {
        if (dataExtendAttribute) {
            for (var key in dataExtendAttribute) {
                $target.attr('data-' + key, dataExtendAttribute[key]);
            }
        }
    }

    /*=====================
     * 为指定元素设置指定的属性值
     * $formGroup:要设置的表单元素
     * attr:要设置的属性
     * attrValue:属性值
     * removeInvalidAttr:属性值为false时不添加该属性
     * return this;
     */
    function _SetElementAttribute($target, attr, attrValue, removeInvalidAttr) {
        //判断是否移除无效属性
        if (removeInvalidAttr === false || !!attrValue) {
            $target.attr(attr, attrValue);
        }
    }

    /*====================
     * 生成Label到指定formgroup中
     * $formGroup:目标formgroup
     * labelConfig：label:{target:'',className:'',text:'',required:bool}
     * return this;
     */
    function _GenerateLabelToGormGroup($formGroup, labelConfig) {
        var cur = exports;
        var $label = $(defaultConfig.label);
        if (labelConfig !== false) {
            _SetElementAttribute($label, 'for', labelConfig.target, false);
            $label.addClass(labelConfig.className || '');
            $label.text(labelConfig.text || '');
            //设置label前的是否必填
            if (labelConfig.required) {
                $label.prepend($('<span class="symbol required"></span>'));
            }
            $formGroup.append($label);
        }
        return cur;
    }

    /*==============生成input-group-addon到input-group
    *$inputGroup    :$  容器
    *addonConfig     :{iconClass: 'glyphicon glyphicon-calendar', text: '',type:''} span配置项目
    *return this
    */
    function _GenerateInputGroupAddOn($inputGroup, addonConfig) {
        var cur = exports;
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
                _SetElementAttribute($btn, 'disabled', addonConfig.disabled, true);
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
    };
    /*===========================
    value:配置的item项
    ===========================*/
    /*===========================
    *根据配置生成表单元素内容<div class="col-sm-n"></div>里面的内容
    * $target:目标元素
    * formEleConfig:表单配置
    * return this;
    ===========================*/
    function _GenerateFormElement($target, eleConfig) {
        if (eleConfig.render) {
            $target.append($(eleConfig.render));
            return ;
        }
        var feType = eleConfig.type;
        //存放表单元素
        var $selector = $(defaultConfig[feType]);

        if (feType === "select") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);

            //添加请选择列
            if (eleConfig.withNull) {
                $selector.append($(defaultConfig.nullSelectOption));
            }
            eleConfig.items.forEach(function (item, index, arr) {
                var $ele = $('<option>');
                _SetElementAttribute($ele, 'value', item.value, false);
                _SetElementAttribute($ele, 'selected', item.selected, true);
                _SetDataAttribute($ele, item.extendAttr);
                $ele.text(item.text || '');
                $selector.append($ele);
            });
            $target.append($selector);
        }
        else if (feType === "text" || feType === "datetime" || feType === "search") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);
            //设置value的值
            _SetElementAttribute($selector, 'value', eleConfig.value, true);
            $target.append($selector);
        }
        else if (feType === "img") {
            //图片上传容器
            var $imgContainer = $("<div class='row upload-file' />");
            //图片上传按钮
            var $imgBtnContain = $('<div class="col-sm-12" />');

            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);
            //设置value的值
            $selector.addClass('hide');
            _SetElementAttribute($selector, 'value', eleConfig.value, true);
            _SetElementAttribute($selector, 'multiple', eleConfig.multiple, true);

            $imgBtnContain.append($selector).append($('<button type="button" class="upFileBtn btn btn-primary"><i class="glyphicon glyphicon-open"></i>上传图片</button>'));
            $imgContainer.append($imgBtnContain);
            //图片列表
            var $imgList = $('<div class="col-sm-12 upload-list"><ul></ul></div>');
            $imgContainer.append($imgList);
 
            $target.append($imgContainer);

        }
        else if (feType === "textarea") {
            //设置id、class、name及data-扩展属性
            _SetCommentAttr($selector, eleConfig);
            //设置value的值
            _SetElementAttribute($selector, 'rows', eleConfig.rows, true);
            _SetElementAttribute($selector, 'cols', eleConfig.cols, true);
            $selector.text(eleConfig.value || '');
            $target.append($selector);
        }
        else if (feType === "radio") {
            eleConfig.items.forEach(function (item, index, arr) {
                var $radioContain = $('<label>');
                $radioContain.addClass(eleConfig.selectContainClass);

                var $radio = $(defaultConfig[feType]);
                //设置id、class、name及data-扩展属性
                _SetCommentAttr($radio, eleConfig);
                //设置value的值
                _SetElementAttribute($radio, 'value', item.value, true);

                $radioContain.append($radio);
                $radioContain.append(document.createTextNode(item.text));
                $target.append($radioContain);
            });
        }
        else if (feType === "checkbox") {
            eleConfig.items.forEach(function (item, index, arr) {
                var $radioContain = $('<label>');
                $radioContain.addClass(eleConfig.selectContainClass);

                var $checkbox = $(defaultConfig[feType]);
                //设置id、class、name及data-扩展属性
                _SetCommentAttr($checkbox, eleConfig);
                //设置value的值
                _SetElementAttribute($checkbox, 'value', item.value, true);

                $radioContain.append($checkbox);
                $radioContain.append(document.createTextNode(item.text));
                $target.append($radioContain);
            });
        }
        else {
            console.error("表单插件不支持此类型：" + feType);
        }

        ///设置一些通用属性(id,name,class,data-)
        function _SetCommentAttr($target, eleConfig) {
            _SetElementAttribute($target, 'id', eleConfig.id, true);
            _SetElementAttribute($target, 'name', eleConfig.name, true);
            _SetElementAttribute($target, 'readonly', eleConfig.readonly, true);
            _SetElementAttribute($target, 'disabled', eleConfig.disabled, true);
            //if ($target.hasAttribute('class') == false) {
            //    _SetElementAttribute($target, 'class', eleConfig.className, true);
            //}
            //else {
            $target.addClass(eleConfig.className);
            //}
            _SetDataAttribute($target, eleConfig.extendAttr);
        }
    };
    /*===========================
    value:配置的item项
    ===========================*/
    /*===========================
    *根据配置生成input-group及元素前|后的input-group-addon
    * $colSM    :$  目标元素
    * eleConfig :[]    元素的配置
    * return this;
    ===========================*/
    function _GenerateImputGroup($colSM, eleConfig) {
        var $inputGroup;
        if (eleConfig.pre || eleConfig.next) {
            $inputGroup = $('<div class="input-group"/>');
            if (eleConfig.pre) {
                _GenerateInputGroupAddOn($inputGroup, eleConfig.pre);
            }
            _GenerateFormElement($inputGroup, eleConfig);
            if (eleConfig.next) {
                _GenerateInputGroupAddOn($inputGroup, eleConfig.next);
            }
            $colSM.append($inputGroup);
        }
        else {
            _GenerateFormElement($colSM, eleConfig);
        }
    };
    /*===================
     * 根据配置生成表单外层labe和div.col-sm-n
     * $formGroup:最外层的div.form-group
     * itemConfig:针对item的配置节点
     */
    function _GenerateColSM($formGroup, itemConfig) {
        if (itemConfig.render) {
            $formGroup.append($(itemConfig.render));
            return ;
        }
        if (!itemConfig.label && !itemConfig.ele) {
            return ;
        }
        _GenerateLabelToGormGroup($formGroup, itemConfig['label']);
        //生成.col-sm-n
        var $col = $('<div />');
        $col.addClass(itemConfig.ele.parentClassName);
        //生成.col-sm-n 里面的内容(input-group或者表单元素)
        _GenerateImputGroup($col, itemConfig.ele);
        $formGroup.append($col);
    };
    /*============生成hide元素
    *containerID    :''    容器
    *hideConfig     :Array   隐藏表单元素配置列
    *return this;
    */
    function _RenderHideEle(containerID, hideConfig) {
        if (hideConfig && hideConfig.length > 0) {
            var $contain = global.Fn.$(containerID);
            hideConfig.forEach(function (item) {
                var $hide = $('<input type="hidden"/>');
                $hide.attr("id", item.id).attr('name', item.name).attr('value', item.value);
                $contain.append($hide);
            });
        }
    };
    /*====================根据配置项生成可见表单元素
    *containerID：'' 容器id
    *visibleConfig  :[]|{}  可见元素配置项
    */
    function _RenderVisibleEle(containerID, visibleConfig) {
        var $contain = global.Fn.$(containerID);
        //定义一个存放生成的表单的容器，考虑性能原因，用临时div存储生成的form-group
        var $formContent = $('<div/>');
        $.each(visibleConfig, function (index, value) {
            var $formGroup = $('<div class="form-group"/>');
            //单项
            if (!value.length) {
                _GenerateColSM($formGroup, value);
            }
            else {
                $.each(value, function (index, value1) {
                    _GenerateColSM($formGroup, value1);
                });
            }
            $formContent.append($formGroup);
        });
        $contain.append($formContent.html());
    };

    // #endregion
};