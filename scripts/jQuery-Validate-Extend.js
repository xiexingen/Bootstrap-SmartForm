/**日期比较
    支持两个日期之间的比较(>,<,=)，支持直接传入固定日期进行对比
    param:string || {type:"<",format:"ymd",object:null} || json
*/
jQuery.validator.addMethod("compareDate", function (value, element, param) {
    var elseDate = $.type(param) == "object" ? param.object : param;
    if (!value) return true;
    var _type = param.type == "=" ? "==" : param.type || "<";
    var _format = param.format || "ymd";
    var _thisDate = global.Fn.formatDate(value + ":" + _format, "yyyy-MM-dd");
    if (/\d{2,4}([\s\-\/]{1})\d{1,2}\1\d{1,4}/.test(elseDate)) {
        var _elseDate = new Date(elseDate);
    } else if (elseDate.constructor == Date) {
        _elseDate = elseDate;
    } else {
        var $elseDate = $(elseDate);
        if (!$elseDate.val()) return true;
        if (!$elseDate[0]) return;
        var _elseDate = global.Fn.formatDate($elseDate.val() + ":" + _format, "yyyy-MM-dd");

        //为另一个对象添加验证规则
        if (!$elseDate.rules().compareDate) {
            var _elseRule = {};
            if (_type.match("==")) {
                _elseRule.type = "=";
            } else if (_type.match(">")) {
                _elseRule.type = _type.replace(">", "<");
            } else if (_type.match("<")) {
                _elseRule.type = _type.replace("<", ">");
            } else {
                _elseRule.type = _type
            }
            _elseRule.object = "#" + element.id;
            $elseDate.rules("add", { compareDate: _elseRule });
        }
    }
    var result = eval("" + Date.parse(_thisDate) + _type + Date.parse(_elseDate));
    return result;
});

//all cache false;
jQuery.validator.addMethod("htmltag", function (value, element, parm) {
    var htmltag1 = /<(\/\s*)?((\w+:)?\w+)(\w+(\s*=\s*((["'])(\\["'tbnr]|[^\7])*?\7|\w+)|.{0})|\s)*?(\/\s*)?>/ig;
    return this.optional(element) || !htmltag1.test(value);
}, "Not allowed to enter the HTML tag.");

//验证两个文本框不能同时为空
jQuery.validator.addMethod("bothEmpty", function (value, element, parm) {
    if (value == '' && $("#" + parm).val() == '') return false;
    else
        return true;
}, "PaymentTerm1 and PaymentTerm2 can not both be empty.");


//验证值范围，自动去掉非数值字符"."除外 如2,010,000.00自动验证 2010000.00
jQuery.validator.addMethod("range", function (value, element, parm) {
    var reg = /[^\d+(.)]/g;
    var value = value.replace(reg, "");
    return (value < parm[0] || value > parm[1]) ? false : true;
}, "This Field value should be between {0} - {1} .");


//验证日期小于指定范围内
jQuery.validator.addMethod("compareRangeDate", function (value, element, parm) {
    var startDate = jQuery("#" + parm).val();
    if (!$.trim(startDate) == "") {
        var result = startDate.split("-");
        //alert(Date.parse(result[0]));
        var startDate = result[1] + "/12/31";
        //alert(startDate);
        var date1 = new Date(Date.parse(startDate.replace("-", "/")));
        var date2 = new Date(Date.parse(value.replace("-", "/")));
        return date1 >= date2;
    } else {
        return true;
    }

}, "Date is invalid!!");

//验证日期大于指定范围内
jQuery.validator.addMethod("compareRangeDateToDate", function (value, element, parm) {
    var startDate = jQuery("#" + parm).val();
    if (!$.trim(startDate) == "") {
        var result = startDate.split("-");
        //alert(Date.parse(result[0]));
        var startDate = result[0] + "/01/01";
        //alert(startDate);
        var date1 = new Date(Date.parse(startDate.replace("-", "/")));
        var date2 = new Date(Date.parse(value.replace("-", "/")));
        return date1 <= date2;
    } else {
        return true;
    }

}, "Date is invalid!!");

/**验证指定元素不能同时为空：支持同时验证多个元素
    param:string || array
    Create by Aaron [20140318]
*/
jQuery.validator.addMethod("cantempty", function (value, element, param) {
    if ($.type(param) != "array") param = [param];
    var eleresult = false;

    //复制数组
    var newElements = global.Fn.copy(param);
    for (var i = 0; i < param.length; i++) {
        if ($(param[i]).val()) {
            eleresult = true;
            break;
        }
        if (!$(param[i]).rules().cantempty) {
            newElements.splice(i, 1, "#" + element.id);
            $(param[i]).rules("add", { cantempty: newElements });
            //eleresult = $(param[i]).valid();
            //break;
        }
    }
    var result = (value || eleresult) ? true : false;
    return result;
}, "This fields can not be empty.");


/* 判断负数 */
jQuery.validator.addMethod("negativeCheck", function (value, element, param) {
    if (!isNaN(value))
        return parseFloat(value) >= 0;
}, "Please enter a number greater than 0.");


/**日期有效性验证
    日期是否在某个时间段
    param:number || string || array
    Create by Aaron [20140319]
*/
jQuery.validator.addMethod("inDate", function (value, element, param) {
    var _format = "dmy";
    var _inDate = param, _inEndDate;
    if ($.type(param) == "array") {
        _inDate = param[0];
        _inEndDate = param[1];
    }
    var _thisDate = Date.parse(global.Fn.formatDate(value + ":" + _format, "MM/dd/yyyy"));
    _inDate = Date.parse(_inDate);
    if (_inEndDate) {
        _inEndDate = Date.parse(_inEndDate);
        return (_thisDate >= _inDate && _thisDate <= _inEndDate);
    }
    return _thisDate <= _inDate;
}, "This date is not in {0}");

/** check from and to should both have value in group
*/
jQuery.validator.addMethod("groupDateRequired", function (value, element, param)
{
    var groupArray = param.split(',');
    $.each(groupArray, function (i, o)
    {
        groupArray[i] = ('input[name=' + o + ']');
    })
    if (!value)
    {
        if (!$(groupArray[0]).val())
        {
            return !!($(groupArray[1]).val() && $(groupArray[2]).val());
        }
        else
        {
            return false;
        }
    }
    if (value)
    {
        if (!$(groupArray[0]).val())
        {
            return false;
        }
        else
        {
            return !($(groupArray[1]).val() || $(groupArray[2]).val());
        }
    }
    return true;
}, "From and To must be both have value!");

/** inFinlYear - Check whether is in the finance year
param:number || string || array
if(array)
{
    [finlYearFromDate,finlYearToDate]
}
if(string)
{
    if(element is FromDate)
        [finlYearFromDate]
    if(element is ToDate)
        [finlYearToDate]
}
*/
jQuery.validator.addMethod("inFinlYear", function (value, element, param)
{
    var _format = "dmy";
    var _inDate = param, _inEndDate;
    if ($.type(param) == "array")
    {
        _inDate = param[0];
        _inEndDate = param[1];
    }
    var _thisDate = Date.parse(global.Fn.formatDate(value + ":" + _format, "MM/dd/yyyy"));
    _inDate = Date.parse(_inDate);
    if (_inEndDate)
    {
        _inEndDate = Date.parse(_inEndDate);
        return (_thisDate >= _inDate && _thisDate <= _inEndDate);
    }
    return element.attributes.name.value.indexOf('To') > -1 ? (_thisDate <= _inDate) : (_inDate <= _thisDate);
}, "This date is not in {0}");

/**当控件为一定值时，指定字段必填
    param:[{value:array,element:array}]
    Create by Aaron [20140313]
*/
jQuery.validator.addMethod("dorequired", function (value, element, param) {
    if ($.type(param) != "array") param = [param];
    for (var i = 0; i < param.length; i++) {
        var obj = param[i];
        if (!obj.element || obj.element.length < 1) continue;
        var _value = (obj.value && $.type(obj.value) != "array") ? [obj.value] : obj.value;
        var _ele = $.type(obj.element) == "array" ? obj.element : obj.element.split(",");
        for (var j = 0; j < _ele.length; j++) {
            var $self = $(_ele[j]);
            if (!$self.rules().required && (!obj.value || _value.length < 1 || $.inArray(value, _value) != -1)) {
                    $self.rules("add", { required: true });
                    return $self.valid();
            } else if ($self.rules().required && $.inArray(value, _value) == -1) {
                $self.removeClass("required").rules("remove", "required");
                return $self.valid();
            }
        }
    }
    return true;
}, "");

/**格式化金额格式10,000,000.00
    param:boolean
*/
jQuery.validator.addMethod("amount", function (value, element, param) {
    var amountReg = /^[1-9](?:\d*,\d{3})*(?:(\.\d+|$))/;
    if (param == true) return amountReg.test(value);
    return true;
}, "Please enter a valid Amount");

/**惟一性验证，返回消息格式<XXX> is duplicated!
param:与remote一致
Create By Gary[20140327]
*/
jQuery.validator.addMethod("duplicatedRemote", function (value, element, param) {
    if (this.optional(element))
        return "dependency-mismatch";
    var previous = this.previousValue(element);
    if (!this.settings.messages[element.name])
        this.settings.messages[element.name] = {};
    previous.originalMessage = this.settings.messages[element.name].remote;
    this.settings.messages[element.name].remote = previous.message;
    param = typeof param == "string" && { url: param } || param;
    var validator = this;
    if (previous.old != value) {
        previous.old = value;
        var validator = this;
        this.startRequest(element);
        var data = {};
        data[element.name] = value;
        $.ajax($.extend(true, {
            url: param,
            mode: "abort",
            port: "validate" + element.name,
            dataType: "json",
            type: "post",
            data: data,
            success: function (response) {
                //var tempResponse = response;
                //if (tempResponse.result != undefined) {
                //    response = tempResponse.result;
                //}
                //if (tempResponse.code != undefined) {
                //    validator.settings.messages[element.name].remote = "&lt;" + tempResponse.code + "&gt;is duplicated!";
                //} else {
                //    validator.settings.messages[element.name].remote =previous.originalMessage;
                //}
                var valid = response === true;
                if (valid) {
                    var submitted = validator.formSubmitted;
                    validator.prepareElement(element);
                    validator.formSubmitted = submitted;
                    validator.successList.push(element);
                    validator.showErrors();
                } else {
                    var errors = {};
                    var message = value + " is duplicated!"; //response || validator.defaultMessage(element, "remote");
                    errors[element.name] = previous.message = message;// $.isFunction(message) ? message(value) :
                    validator.showErrors(errors);
                }
                previous.valid = valid;
                validator.stopRequest(element, valid);
            }
        }, param));
        return "pending";
    } else if (this.pending[element.name]) {
        return "pending";
    }
    if (previous.valid == true) {
        return previous.valid;
    } else {
        var errors = {};
        errors[element.name] = previous.message;
        validator.showErrors(errors);
        return "pending";
    }
}, "This Field is duplicated!");

/*
设置显示duplication时，是显示对象的Text值还是Value值，例如DropDown控件
param.objID -> $('#'+objID) //如果param.objID没给值，默认用element.id
param.objType -> ['text'|'value']   'text': get obj.text(),  'value': get obj.val() //如果param.objType没给值，默认用value

示例: 
    param.objID: "popAgentID option:selected", //这是用在DropDown控件的
    param.objType:'text' //param.objType选text，显示duplication信息时，就取DropDown控件所选的item的text值
*/
jQuery.validator.addMethod("duplicatedRemoteCustomized", function (value, element, param) {
    if (this.optional(element))
        return "dependency-mismatch";
    var previous = this.previousValue(element);
    if (!this.settings.messages[element.name])
        this.settings.messages[element.name] = {};
    previous.originalMessage = this.settings.messages[element.name].remote;
    this.settings.messages[element.name].remote = previous.message;
    param = typeof param == "string" && { url: param } || param;
    var validator = this;
    if (previous.old != value) {
        previous.old = value;
        var validator = this;
        this.startRequest(element);
        var data = {};
        data[element.name] = value;
        $.ajax($.extend(true, {
            url: param,
            mode: "abort",
            port: "validate" + element.name,
            dataType: "json",
            type: "post",
            data: data,
            success: function (response) {
                var valid = response === true;
                if (valid) {
                    var submitted = validator.formSubmitted;
                    validator.prepareElement(element);
                    validator.formSubmitted = submitted;
                    validator.successList.push(element);
                    validator.showErrors();
                } else {
                    var errors = {};
                    if (!param.objID)
                        param.objID = element.id;
                    var objName = param.objType == 'text' ? $('#' + param.objID).text() : param.objType == 'value' ? $('#' + param.objID).val() : value;
                    var message = objName + " is duplicated!";
                    errors[element.name] = previous.message = message;
                    validator.showErrors(errors);
                }
                previous.valid = valid;
                validator.stopRequest(element, valid);
            }
        }, param));
        return "pending";
    } else if (this.pending[element.name]) {
        return "pending";
    }
    if (previous.valid == true) {
        return previous.valid;
    } else {
        var errors = {};
        errors[element.name] = previous.message;
        validator.showErrors(errors);
        return "pending";
    }
}, "This Field is duplicated!");

/**
 * 验证手机号格式
 */
jQuery.validator.addMethod("isMobile", function(value, element) {
var length = value.length;
var mobile = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/g;
return this.optional(element) || (length == 11 && mobile.test(value));
}, "请正确填写您的手机号码");

jQuery.extend(jQuery.validator.messages, {
    required: "该字段必填",
    remote: "请修正该字段",
    email: "请输入正确格式的电子邮件",
    url: "请输入合法的网址",
    date: "请输入合法的日期",
    dateISO: "请输入合法的日期 (ISO).",
    number: "请输入合法的数字",
    digits: "只能输入整数",
    creditcard: "请输入合法的信用卡号",
    equalTo: "请再次输入相同的值",
    accept: "请输入拥有合法后缀名的字符串",
    maxlength: jQuery.validator.format("请输入一个 长度最多是 {0} 的字符串"),
    minlength: jQuery.validator.format("请输入一个 长度最少是 {0} 的字符串"),
    rangelength: jQuery.validator.format("请输入 一个长度介于 {0} 和 {1} 之间的字符串"),
    range: jQuery.validator.format("请输入一个介于 {0} 和 {1} 之间的值"),
    max: jQuery.validator.format("请输入一个最大为{0} 的值"),
    min: jQuery.validator.format("请输入一个最小为{0} 的值"),
    compareDate: jQuery.validator.format("选择的日期范围有误")
});