/* Put methods that are only used during the customer view of the Campaign form here.
Feel free to put loads of comments in the code and be sure to minify
this script any time it's edited. The Campaign_DesignForm.page should
always load the minified version. */
/* The rc variable below will already be declared before this script is loaded.
That way we can reference variables set in our VF Page that we wouldn't have access to here.
*/
rc = rc || {};
rc.ui = rc.ui || {};
rc.components = rc.components || {};
rc.dataModal = rc.dataModal || {}

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

rc.initializeParams();// todo: find a better place to call this

// UI helpers
rc.ui.SUCCESS = 'alert-success';
rc.ui.ERROR = 'alert-danger';
rc.ui.WARNING = 'alert-warning';
rc.ui.INFO = 'alert-info';
rc.ui.MessageHeaders = {};
rc.ui.MessageHeaders[rc.ui.SUCCESS] = 'Yay' ;
rc.ui.MessageHeaders[rc.ui.ERROR] = 'Attention!';
rc.ui.MessageHeaders[rc.ui.WARNING] = 'Warning!';
rc.ui.MessageHeaders[rc.ui.INFO] = '';
//merge field labels
rc.ui.CONTACT_MAIL1 = '<Contact Mail 1>';
rc.ui.CONTACT_MAIL2 = '<Contact Mail 2>';
//merge field labels -> field(req) and control field to on/off functionality(optional)
rc.ui.MergeFieldMap = {};
rc.ui.MergeFieldMap[rc.ui.CONTACT_MAIL1] = {field:rc.ns + 'contact_1_email__c',control:rc.ns + 'contact_1_email_opt_out__c'};
rc.ui.MergeFieldMap[rc.ui.CONTACT_MAIL2] = {field:rc.ns + 'contact_2_email__c',control:rc.ns + 'contact_2_email_opt_out__c'};

rc.ui.showMessagePopup = function(type,message) {
	message = message || '';
	message = rc.context.trim(message);
	//remove message box if already active
	//user should not miss old error message due to new error message
	var container = rc.context('.info-message-container');
	var curText =container.find(".message-box .message").html() || '';
	if (curText.indexOf(message)!=-1) {return;}
	if (container.find(".message-box").length && type==='error' && curText.indexOf(message) == -1) {
		message = curText + '<br/><br/>' + message;
	}
	container.find(".message-box").remove();
	container.prepend(rc.context("#message-box-template").html());
	container.find('.message-box .message').html(message);
	container.find('.message-box').addClass(type);
	if (message.length > 50) {
		container.find('.message-box').css('left','28%');
		container.find('.message-box').css('width','37.5%');
	}
	container.find('.message-box').show();
	container.find(".message-box").unbind("click").click(function() {
		container.find('.message-box').fadeOut(1000, function() {rc.context(this).remove();});
	});
};

rc.ui.addMessageToComponent = function(component,message,type,showInMode) {
	component = component || rc.context('body');
	var exist = rc.context(component).closest(".rc-container-column").find(".component-alert .message-text:contains("+message+")");
	if (exist.length) {return exist.closest(".component-alert ");}
	var templateHtml = rc.context("#rc-alert-item.rc-template").html();
	var messageBox = rc.context(templateHtml);
	type = type || rc.ui.WARNING;
	message = message || '';
	messageBox.addClass(type);
	messageBox.find(".message-header").text(rc.ui.MessageHeaders[type]);
	messageBox.find(".message-text").text(message).addClass("animated shake");
	rc.context(component).closest(".rc-container-column").prepend(messageBox);
	showInMode= showInMode || "edit";
	if (showInMode==="edit") {
		messageBox.addClass("rc-requires-edit");
	} else if (showInMode==="view") {
		messageBox.addClass("rc-requires-view");
	} else if (showInMode==="flow") {
		messageBox.addClass("rc-requires-flow");
	}
	return messageBox;
};

rc.ui.getComponentMessages = function(component,message,type) {
	component = component || rc.context("body");
	if (message && message!='') {
		var exist=rc.context(component).closest(".rc-container-column").find(".component-alert .message-text:contains("+message+")");
		if (exist.length) {return exist.closest(".component-alert ");}
	} else if (type) {
		return rc.context(component).closest(".rc-container-column").find(".component-alert ."+type);
	}
	return rc.context(component).closest(".rc-container-column").find(".component-alert");
};

rc.ui.cascadeSelected = function() {
	rc.context('.rc-selected').removeClass('rc-selected');
	rc.context(this).closest('html,.rc-container,.rc-component').addClass('rc-selected');
};

rc.ui.cascadeCss = function() {
	var name = rc.context(this).attr('data-css-name');
	var data = rc.context(this).attr('data-css') || 'auto';
	rc.context(this).closest('.rc-cascade-css-target').css(name, data);
};

rc.ui.cascadeDropdownText = function() {
	var item = rc.context(this);
	//if the element is disabled dont cascade the value
	if (item.is("[disabled]") && item.attr("data-cascade")=="data-method" && item.attr("data-value")=="send-payment" && rc.getCurrentMode() == "flow") {
		return;
	}
	var text = item.attr('data-dropdown-text') || item.text();
	item.closest('.btn-group').find('.dropdown-toggle-text').text(text);
};

rc.ui.flipOverflownDropdown = function(event) {
	var dropdownEl = $(this);
	var viewableOffset = $(dropdownEl).offset().top - $(window).scrollTop();
	var elemHeight = $(dropdownEl).height();
	var innerHeight = $(window).innerHeight();
	var menuHeight = $(dropdownEl).find(".dropdown-menu").height();
	if ((viewableOffset+elemHeight+menuHeight) > innerHeight) {
		$(dropdownEl).addClass("dropup");
		//if menu overflows at top
		if (menuHeight>viewableOffset) {
			$(dropdownEl).find(".dropdown-menu").css("height",viewableOffset-20);
			$(dropdownEl).find(".dropdown-menu").css("overflow","scroll");
		}
	} else if ($(dropdownEl).hasClass("dropup")) {
		$(dropdownEl).removeClass("dropup")
	}
	return true;
};

rc.ui.cascadeInput = function() {
	var name = rc.context(this).attr('data-cascade') || 'data-value';
	var data = rc.context(this).val();
	rc.context(this).closest('.rc-cascade-value-target').attr(name, data);
};

rc.ui.cascadeInputGroup = function() {
	var data = rc.context(this).attr('data-value')
	var element = rc.context(this).closest('.input-group').find('.form-control');
	element.val(data);
	element.change();
	rc.validateInput.validateField(element);
};

rc.ui.cascadeValue = function() {
	var cascadeTarget = rc.context(this).closest('.rc-cascade-value-target');
	if (!cascadeTarget) {return;}
	var item = rc.context(this);
	//if the element is disabled dont cascade the value
	if (item.is("[disabled]") && item.attr("data-cascade")=="data-method" && item.attr("data-value")=="send-payment" && rc.getCurrentMode() == "flow") {
		return;
	}
	var name = rc.context(this).attr('data-cascade') || 'data-value';
	var oldData = cascadeTarget.attr(name) || '';
	var data = rc.context(this).attr('data-value');
	cascadeTarget.attr(name, data);
	cascadeTarget.trigger('cascade-value-changed',{attribute:name,value:data,oldvalue:oldData,source:this});
	if (item.hasClass("rc-cascade-toggle-label") == true) {
		var oldLabel = item.text() || "";
		var toggleLabel = item.attr("data-cascade-toggle-label") || "";
		var toggleValue = item.attr("data-cascade-toggle-value") || (data=="true"?"false":"");
		var toggleClass = item.attr("data-cascade-toggle-class") || "";
		//back of current data
		item.attr("data-cascade-toggle-label",oldLabel);
		item.attr("data-cascade-toggle-value",data);
		//set new value for next change
		item.attr("data-value",toggleValue);
		item.text(toggleLabel);
		item.toggleClass(toggleClass);
	}
	// Mark selected the item to cascade
	rc.ui.togglePlaceholderForm(item, cascadeTarget);
};

rc.ui.cascadeValueToggle = function() {
	var name = rc.context(this).attr('data-cascade') || 'data-value';
	var data = rc.context(this).attr('data-value');
	var target = rc.context(this).closest('.rc-cascade-value-target');
	if (target.attr(name)) {
		target.attr(name, '');
	} else {
		target.attr(name, data);
	}
};

rc.ui.filterDropdown = function() {
	// Find the menu
	var menu = rc.context(this).closest('.rc-filter-dropdown-container').find('.dropdown-menu');
	var data = rc.context(this).val() || '';
	var pattern = new RegExp(data || '.+', 'i');
	menu.find('.list-group-item').each(function() {
		var item = rc.context(this);
		var text = item.attr('data-filter-text');
		if (text && text.match(pattern)) {
			item.show();
		} else {
			item.hide();
		}
	});
	if ((data || '').length == 0) {
		menu.hide();
	} else {
		menu.show();
	}
};

rc.ui.toggleActive = function() {
	rc.context(this).closest('.rc-toggle-active-container').find('.rc-toggle-active').removeClass('active');
	rc.context(this).addClass('active');
};

rc.ui.toggleContentEditable = function() {
	var editable = 'edit' == rc.context(this).attr('data-value');
	rc.context('#rc-container-list').find('[contenteditable]').attr('contenteditable', editable);
	//trigger view changed events so all listeners to this event may take action
	rc.events.trigger('view-change',editable);
};

rc.ui.togglePrimary = function() {
	var parentContainer = rc.context(this).closest('.rc-toggle-primary-container');
	rc.context(parentContainer).find('.rc-toggle-primary').removeClass('btn-primary');
	//#TODO	: Move code to Campaign Ask Component
	//Fix for RCSBIRD-20315 - Check if this is done from Campaign Ask component only for frequency buttons OR for giving amount buttons
	if (rc.context(parentContainer).hasClass('rc-campaign-ask-frequency-list')
		|| rc.context(parentContainer).hasClass('rc-component-campaign-ask-item-list')) {
		var campaignAskComponent = rc.context(this).closest('.rc-component-campaign-ask');
		// If yes then trigger change action to re-validate the component
		campaignAskComponent.find('[data-validate-type="otherAmount"]').change();
	}
	if (rc.context(this).hasClass("btn-primary")) {
		rc.context(this).removeClass("btn-primary");
	} else {
		rc.context(this).addClass("btn-primary");
	}
};

rc.ui.toggleSiblings = function() {
	var item = rc.context(this);
	//if the element is disabled dont cascade the value
	if (item.is("[disabled]") && item.attr("data-cascade")=="data-method" && item.attr("data-value")=="send-payment" && rc.getCurrentMode() == "flow") {
		return;
	}
	var container = item.closest('.rc-toggle-siblings-container');
	if (item.hasClass('rc-immediate')) {
		container.find(item.attr('data-hide')).hide();
		container.find(item.attr('data-show')).show();
	} else {
		container.find(item.attr('data-hide')).not(item.attr('data-show')).slideUp();
		container.find(item.attr('data-show')).slideDown();
	}
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
