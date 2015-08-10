/*
    simpleConfig:{
        url:'',
        autoParam:[],
        idKey:'',
        pIdKey:'',
        name:'',
        target:'',
    }
    */
/*
	  simpleConfig:{
		  url:'',
		  autoParam:[],
		  idKey:'',
		  pIdKey:'',
		  name:'',
		  target:'',
	  }
	  */
function TBHTree(simpleConfig) {
	var setting = {
		async: {
			enable: true,
			//contentType: "application/json",
			dataType: "json",
			url: simpleConfig.asyncUrl,
			autoParam: simpleConfig.autoParam,
			dataFilter: function (treeId, treeNode, postBackData) {
				var data;
				if (postBackData['code'] == 200) {
					data = postBackData['info'];
				}
				else {
					throw '请求数据失败！';
				}
				return data;
			}
		},
		view: {
			//addHoverDom: addHoverDom,
			//removeHoverDom: removeHoverDom,
			selectedMulti: false,
			txtSelectedEnable: true,
			showIcon: false
		},
		check: {
			enable: true,
			//chkStyle:'radio'
		},
		data: {
			simpleData: {
				enable: true,
				idKey: simpleConfig.idKey,
				pIdKey: simpleConfig.pIdKey
			},
			key: {
				name: simpleConfig.name
			},
			keep: {
				parent: true,
				//leaf:true
			}
		},
		callback: {
			onClick: function (event, treeId, treeNode) {
				exports.treeObj.checkNode(treeNode, !treeNode.checked, false);
			},
			beforeExpand: beforeExpand,
			onAsyncSuccess: onAsyncSuccess,
			//beforeAsync: beforeAsync
		}
	};

	//function beforeAsync() {
	//	debugger;
	//}

	function beforeExpand(treeId, treeNode) {
	    if (treeNode.children) {
	        return true;
	    }
		if (treeNode.isAjaxing !== false) {
			ajaxGetNodes(treeNode, "refresh");
			return true;
		}

	}

	function onAsyncSuccess(event, treeId, treeNode, backData) {
		//if (exports.setting.async.successCallBack) {
		//    backData = exports.setting.async.successCallBack(backData);
		//}
		//if (!backData || backData.length == 0) {
		//    return;
		//}
		//if (treeNode.children.length == 1 && treeNode.children[0]['code']=='200') {
		//    //setTimeout(function () { ajaxGetNodes(treeNode); }, perTime);
		//    var nodes = exports.treeObj.transformTozTreeNodes(backData);
		//    treeNode.children = nodes;
		//} else {
		//    //treeNode.icon = "";

		//    //exports.treeObj.selectNode(treeNode.children[0]);
		//    //className = (className === "dark" ? "" : "dark");
	    //}
	    if (treeNode.children && treeNode.children.length==0) {
	        treeNode.isParent = false;
	    }
		exports.treeObj.updateNode(treeNode);
	}

	function ajaxGetNodes(treeNode, reloadType) {
		if (reloadType == "refresh") {
			exports.treeObj.reAsyncChildNodes(treeNode, reloadType, true);
		}
		else {
			exports.treeObj.updateNode(treeNode);
		}
	}

	var exports = {};
	exports.config = simpleConfig; //传入的配置文件
	exports.setting = setting;  //默认设置
	exports.lastData = [];//最后请求的数据
	exports.treeObj;

	exports.AjaxGetData = function (postData) {
		global.Fn.$(simpleConfig.target).block({
			//message: '<img src="/images/images/loading.gif" />',
			message: '<span>加载中...</span>',
			css: { border: '1px solid gray', width: 'auto', height: 'auto', backgroundColor: 'transparent', border: 'none' }
		});
		var deffer = $.Deferred();
		$.ajax({
			url: exports.config.url,
			type: 'post',
			data: postData,
			//dataType: 'text/plain',
			success: function (data) {
				data = JSON.parse(data);
				exports.lastData = data['info']['result_list'];
				deffer.resolve();
				global.Fn.$(simpleConfig.target).unblock();
			},
			error: function () {
				console.error('数据接口出错！');
				global.Fn.$(simpleConfig.target).unblock();
			}
		});
		return deffer.promise();
	},
	exports.Render = function (callBack) {
		$.when(exports.AjaxGetData()).done(function () {
			$.fn.zTree.init(global.Fn.$(simpleConfig.target), setting, exports.lastData);
			exports.treeObj = $.fn.zTree.getZTreeObj(global.Fn.$(simpleConfig.target).attr('id'));
			if (callBack) {
				callBack()
			}
		});
		return exports;
	};

	//展开/折叠 指定层级的节点
	exports.ToggleExpandByLevel = function (level, node) {
		var nodes = (node && node.children) || exports.treeObj.getNodes() || [];
		nodes.forEach(function (node) {
			if (node['level'] <= level) {
				exports.treeObj.expandNode(node);
				if (node['level'] < level) {
					exports.ToggleExpandByLevel(level, node);
				}
			}
		})
	};

	return exports;
}