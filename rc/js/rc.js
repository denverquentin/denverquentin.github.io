/* Put methods that are only used during the customer view of the Campaign form here.
Feel free to put loads of comments in the code and be sure to minify
this script any time it's edited. The Campaign_DesignForm.page should
always load the minified version. */
/* The rc variable below will already be declared before this script is loaded.
That way we can reference variables set in our VF Page that we wouldn't have access to here.
*/
rc = rc || {};


/// DONE & TESTED BELOW! FINISH TODO'S AS LAST STEP
rc.initializeParams = function() {
	rc.params = {};
	var hash = (window.location.hash || '#!mode=view').substring(2);
	if (hash == null) {return;}
	rc.context(hash.split('&')).each(function() {
		var data = this.split('=');
		if (data[0] == null || data[0] == '') {return;}
		if (data[1] == 'true') {data[1] = true;}
		if (data[1] == 'false') {data[1] = false;}
		// Save param
		rc.setParam(data[0], data[1]);
	});
};

rc.getCurrentMode = function() {
	return rc.getParam('mode') || 'view';
};

rc.getParam = function(name) {
	if (/false/.test(rc.isEditMode) && /mode/.test(name)) {return 'view';}
	return rc.params[name] || null;
};

rc.setParam = function(name, data) {
	if (/false/.test(rc.isEditMode) && /mode/.test(name)) {return;}
	rc.params[name] = data;
	var hash = '';
	for (name in rc.params) {
		data = rc.params[name];
		if (data != null) {
			hash += hash == '' ? '#!' : '&';
			hash += name + '=' + data;
		}
	}
	window.location.hash = hash;
};

rc.ui.toggleHiddenFields = function(component) {
	component = rc.context(component) || '';
	component.find('[data-field-hidden="true"]').each(function(index, element) {
		element = rc.context(element) || '';
		/* Remove opacity from all content which are already hidden */
		element.find(".rc-component-content.rc-opacity-md").removeClass("rc-opacity-md");
		/* Hide individual elements */
		element.find("[data-opacity-target='true'], .rc-field-menu").addClass("rc-opacity-md rc-requires-edit");
		/* Add hidden icon */
		element.find(".rc-field-text").each(function(index, fieldLabel) {
			fieldLabel = rc.context(fieldLabel) || '';
			if (fieldLabel.find(".fa-eye-slash").length > 0) {
				return true;
			} else {
				fieldLabel.prepend('<span class="fa fa-fw fa-eye-slash pull-right rc-margin-xs rc-tooltip" data-toggle="tooltip" data-title="Hidden Field"></span>');
			}
		});
		/* For event components */
		if (!!!element.find("[data-opacity-target='true']").length > 0) {
			element.addClass('rc-requires-edit rc-opacity-md');
		}
	});
	/* Unhide these */
	component.find('[data-field-hidden="false"]').each(function(index, element) {
		element = rc.context(element) || '';
		/* For events components */
		element.removeClass('rc-requires-edit rc-opacity-md');
		/* Unhide individual elements */
		element.find("[data-opacity-target='true'], .rc-field-menu").removeClass("rc-opacity-md rc-requires-edit");
		/* Remove hidden icon */
		element.find(".rc-field-text").each(function(index, fieldLabel) {
			fieldLabel = rc.context(fieldLabel) || '';
			if (fieldLabel.find(".fa-eye-slash").length > 0) {fieldLabel.find(".fa-eye-slash").remove();}
		});
	});
	component.find('.rc-tooltip').tooltip();
	return true;
}

/* Data Model - used in all modes */
rc.dataModal = rc.dataModal || {}
rc.dataModal.BatchUploadModel = {};
rc.dataModal.getFieldByName = function(fieldName, fieldSelector) {
	/* give priority to field being on current page, which has most fresh data */
	var fieldJQ = rc.context(fieldSelector).filter(':first');
	if (fieldJQ.length > 0) {
		return fieldJQ.val();
	} else {
		return rc.dataModal.BatchUploadModel[fieldName] || "";
	}
};

rc.text = function(text) { return $('<div></div>').html(text).text(); };

rc.html_decode = function(text) {
	text = text || "";
	text = text.replace(new RegExp('&' + 'amp;', 'g'), '&');
	text = text.replace(new RegExp('&' + 'quot;', 'g'), '"');
	text = text.replace(new RegExp('&' + '#39;', 'g'), '\'');
	text = text.replace(new RegExp('&' + 'lt;', 'g'), '<');
	text = text.replace(new RegExp('&' + 'gt;', 'g'), '>');
	return text;
};

rc.cleanKeysToLower = function(sourceObject) {
	var key;
	var keys = rc.getKeys(sourceObject);
	var n = keys.length;
	var targetObject={}
	while (n--) {
		key = keys[n];
		targetObject[key.toLowerCase()] = sourceObject[key];
	}
	return targetObject;
};

rc.getKeys = function (obj) {
	var r = []
	for (var k in obj) {
		if (!obj.hasOwnProperty(k)) {continue;}
		r.push(k)
	}
	return r;
};

Number.prototype.formatMoney = function(c, d, t) {/* utils/library extensions */
	var n = this, 
	c = isNaN(c = Math.abs(c)) ? 2 : c, 
	d = d == undefined ? "." : d, 
	t = t == undefined ? "," : t, 
	s = n < 0 ? "-" : "", 
	i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
	j = (j = i.length) > 3 ? j % 3 : 0;
	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

/* todo: next method looks to be edit only */
rc.html = function(text) { return $('<div></div>').html(text).html(); };

/* todo: next method looks to be edit only */
rc.guid = function() {/* Create a random ID for the component */
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

/* todo: next method looks to be edit only */
rc.stripTags = function(valueText,tag) {
	var s = valueText || '';
	s = s.replace(RegExp('<\/?' + tag + '[^<>]*>', 'gi'), '');
	return s;
};

/* todo: next method looks to be edit only */
rc.filterComponentData = function(componentsArray) {/* filter / decode data for components */
	rc.context(componentsArray).each(function(index, component_data) {
		var data = component_data || {};
		data.data = data.data || {};
		data.type = data.type || '';
		data.styles = data.styles || {};
		data.defaultValues = data.defaultValues || {};
	});
	return componentsArray;
}

/* todo: next method looks to be edit only */
rc.setModeView = function() {
	var returnVal = rc.setParam('mode', 'view');
	rc.events.trigger('view-change',false);
	return returnVal;
};

/* todo: next method looks to be edit only */
rc.setModeEdit = function() {
	var returnVal = rc.setParam('mode', 'edit');
	rc.events.trigger('view-change',true);
	return returnVal;
};

/* todo: next method looks to be edit only */
rc.setModeFlow = function() {
	var returnVal = rc.setParam('mode', 'flow');
	rc.events.trigger('view-change',false);
	return returnVal;
};

/* todo: next method looks to be edit only */
rc.setHiddenFieldAttribute = function(component, attrValue) {
	rc.console.debug('rc.setHiddenFieldAttribute');
	var componentContentElem = component.find('.rc-component-content');
	if (true == componentContentElem.hasClass("rc-always-hidden-in-view")) {return true;}
	component = rc.context(component) || '';
	attrValue = attrValue || '';
	componentContentElem.attr("data-field-hidden", attrValue == "true");
	return true;
}


/* END OF POSSIBLE EDIT ONLY METHODS */


/* todo: next method doesn't appear to be called */
rc.date = function(originalDate) {/* Helper to convert string date to SF number date */
	if (originalDate) {
		return new Date(originalDate).getTime();
	} else {
		return null;
	}
};

/* todo: next method doesn't appear to be called */
rc.html_encode = function(text) {
	text = text || "";
	text = text.replace(new RexExp('&', 'g'), '&' + 'amp;');
	text = text.replace(new RexExp('"', 'g'), '&' + 'quot;');
	text = text.replace(new RexExp('\'', 'g'), '&' + '#39;');
	text = text.replace(new RexExp('<', 'g'), '&' + 'lt;');
	text = text.replace(new RexExp('>', 'g'), '&' + 'gt;');
	return text;
};
