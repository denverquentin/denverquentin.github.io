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

rc.initializeFormApp = function() {
	console.log('rc.initializeFormApp');
	//rc.components.initialize('.modal');// Copy data templates in modal templates
	//rc.components.initialize('.page-header');// Initialize actions in the page header
	// Component list sorting
	rc.context('#rc-container-list').sortable({placeholder:'rc-state-highlight well',handle:'.rc-container-handle'});
	// Make sure the body tag has a css target
	rc.context('body').addClass('rc-content-css');
	// Inline image data
	rc.context('#rc-component-overview--attach-image').on('change',function() {
		var freader = new FileReader();
		var context = rc.context('#rc-component-overview--attach-image');
		context.removeAttr('data-image-data');
		if (this.files && this.files[0]) {
			freader.onloadend = function(event) {
				context.attr('data-image-data', event.target.result);
			};
			freader.readAsDataURL(this.files[0]);
		}
	});
	rc.selectFormInfoList();// Load the form data
	// Which page mode is set?
	/*
	rc.context('#rc-page-container').find('.page-header [data-value="' + rc.getParam('mode') + '"]').click();
	//on view change refresh html block elements to toggle between html<->text views
	rc.events.on('view-change',rc.components.HtmlBlock.refreshView);
	// on view change, toggle placeholder values shown in fields
	rc.events.on('view-change',rc.rollupPlaceholderValues);// todo: changed view-cahnge to view-change
	// on view change, toggle default values shown in fields
	rc.events.on('view-change',rc.rollupDefaultValues);
	*/
	rc.events.on('form-loaded-with-data',function(event) {
		//functions to initialize components which depends on all components + data load
		//here we have guarantee all components and data is loaded
		//if validations enabled initialize the scene
		rc.validateInput.initialize(); // call into Campaign_Design_Form_Validator.component
		rc.ui.setDropdownVisible();
		rc.ui.removeRedundantOpacity();
	});
	// todo: only call the next 2 if in edit mode
	// also only make these methods visible if in edit mode - they're only called from right here
/*
	console.log('rc.isEditMode = ' + rc.isEditMode);
	if (rc.isEditMode) {
		console.log('bout to initializeModals & initializeHeaderButtons');
		rc.initializeModals();
		rc.initializeHeaderButtons();
	}
*/
};


rc.initializeParams = function() {
	console.log('rc.initializeParams');
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

rc.applyDefaultAttributeDefaultValues = function(component, defaultValues) {
	var component = rc.context(component) || {};
	var defaultValues = defaultValues || {};
	rc.context(rc.context(component).find('.rc-field-name')).each(function() {
		var field = rc.context(this);
		var defaultData = defaultValues[field.attr('name')] || '';
		field.attr('data-field-default', defaultData);
	});
}

rc.applyPlaceholderAttributeValues = function(component, placeholderValues) {
	rc.console.debug('rc.applyPlaceholderAttributeValues');
	var component = rc.context(component) || {};
	var placeholderValues = placeholderValues || {};
	rc.context( rc.context(component).find('.form-control') ).each(function() {
		var field = rc.context(this);
		var defaultData = placeholderValues[field.attr('name')] || placeholderValues[field.attr('data-name')] || field.attr('placeholder') || '';
		field.attr('placeholder', defaultData);
	});
}

rc.rollupDefaultValues = function(event, defaultValues) {
	rc.console.debug('..rc.rollupDefaultValues');
	var defaultValueComponents = rc.context('[data-field-default]');
	if (!defaultValueComponents.length) {return;}
	rc.context(defaultValueComponents).each(function(index, field) {
		var field = rc.context(field);
		var defaultData = field.attr('data-field-default') || '';
		if (field.attr("type") == "checkbox") {
			field.attr('data-field-default', defaultData);
			field.prop('checked', defaultData == "true");
		} else {
			if (field.val() == false || field.val() == '') {field.val(defaultData);}
		}
	});
}

rc.reenable = function(el) {
	if (el) {el.prop("disabled",false);}
}

rc.reInitProductSlots = function() {
	rc.context(".rc-component").each(function(index,component) {
		rc.updateProductSlots(rc.context(component));
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

rc.selectFormInfoList = function(deferred, send) {
	rc.console.debug('rc.selectFormInfoList');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	deferred = deferred || new jQuery.Deferred();
	send = send || {};
	send.__action = rc.actions.selectFormInfoList;
	rc.components.remoting.send(deferred, send, rc.selectFormInfoList.done, rc.selectFormInfoList.fail);
	return deferred.promise();
	};

rc.selectFormInfoList.done = function(deferred, send, recv, meta) {
	rc.console.debug('rc.selectFormInfoList.done');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	rc.console.debug('.. recv', recv);
	rc.console.debug('.. meta', meta);
	// Reset the list
	var list = rc.context('#rc-form-name-list');
	list.find('.rc-form-name').remove();
	// Reset the dropdown text name
	list.siblings().find('.dropdown-toggle-text').html('&nbsp;');
	// Find the workflow action menus
	var menu = rc.context('[data-dropdown-menu="form-list"]');
	menu.empty();
	// Reset the dropdown text name
	menu.siblings().find('.dropdown-toggle-text').html('&nbsp;');
	// Find the divider. It acts as a lower anchor
	var divider = list.find('.divider');
	// Process data
	rc.context(recv).each(function(at, info) {
		var item = rc.context('<li class="rc-form-name"><a class="rc-cursor-pointer rc-cascade-value rc-toggle-active rc-cascade-dropdown-text rc-link"></a></li>');
		item.find('a').attr('data-cascade', 'data-page');
		item.find('a').attr('data-value', info.id);
		item.find('a').text(info.name);
		divider.before(item)
		// Also add to the workflow menues
		var item_clone = item.clone();
		item_clone.find('a').attr('data-cascade', 'data-value');
		menu.append(item_clone);
	});
	// Initialize items
	rc.components.initialize(list);
	rc.components.initialize(menu);
	// When the form item is clicked, reselect the form data
	list.find('.rc-link').on('click', rc.selectFormData);
	// Is there a page already selected? Or just choose the first page?
	var form = rc.paramForm || rc.getParam('form');
	if (form) {
		rc.context('.rc-link[data-value="' + form+ '"]').click();
	} else {
		rc.context('.rc-link:first').click();
	}
	// Mark resolved?
	if (deferred && deferred.resolve) {deferred.resolve();}
};

rc.selectFormInfoList.fail = function(deferred, send, recv, meta) {
	rc.console.debug('rc.selectFormInfoList.fail');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	rc.console.debug('.. recv', recv);
	rc.console.debug('.. meta', meta);
};

rc.selectFormData = function() {
	// Set the page name param
	var form = rc.paramForm || rc.getParam('form');
	rc.setParam('form', rc.context(this).attr('data-value') || form);
	// Set the form link element
	var href = '#{base}/' + rc.ns + 'campaign_designform?1&id=#{cpid}#!mode=view&form=#{form}';
	href = href.replace('#{base}', '//' + rc.siteUrl);
	href = href.replace('#{cpid}', rc.campaignId);
	href = href.replace('#{fcid}', rc.paramFormCampaignId);
	href = href.replace('#{form}', rc.getParam('form'));
	rc.context('.page-header a.fa-link').attr('href', href);
	// Load that page
	rc.remoting.invokeAction(rc.actions.selectFormData,rc.campaignId,rc.getParam('form'),rc.selectFormData.done,{escape:false});
	rc.ui.markProcessing();// Mark processing
};

rc.selectFormData.done = function(data) {
	rc.console.debug('.. rc.selectFormData.done : ', data);
	data = data || {};
	data.containers = data.containers || [];
	data.workflows = data.workflows || [];
	data.data = data.data || {};
	rc.console.debug('.. data : ', data);
	rc.console.debug('.. data.containers : ', data.containers);
	rc.console.debug('.. data.workflows : ', data.workflows);
	rc.console.debug('.. data.data : ', data.data);
	// Apply Page Level CSS
	rc.components.importContentCSS(rc.context("html"), data.styles);
	rc.components.updateContentCSS(rc.context("html"));
	//validations flag
	rc.validationsEnabled = data.data['validations-enabled'] || "false";
	rc.context("#validations-enabled").prop("checked",rc.validationsEnabled=="true").bootstrapToggle(rc.validationsEnabled=="true"?'on':'off');
	// Theme
	if (data.data['theme-href'] && data.data['theme-name']) {
		rc.context('#rc-theme-link').attr('href', data.data['theme-href']);
		rc.context('#rc-theme-link').attr('data-name', data.data['theme-name']);
	} else {
		rc.context('#rc-theme-menu').find('[data-value=""]').click();
	}
	// Empty the product slots, before deleting the container so they can be reused.
	rc.reInitProductSlots();
	// Empty existing container
	rc.context('#rc-container-list').empty();
	rc.context('#rc-workflows-list').empty();
	// Add workflow names to dropdown
	var item_list = rc.context('#rc-component-workflow-action--workflow').find('.dropdown-menu');
	item_list.empty();
	rc.context(data.workflows).each(function(at, data) {
		try {
			var item = rc.context('<a class="rc-cascade-dropdown-text rc-cursor-pointer rc-cascade-value"></a>');
			item.attr('data-cascade', 'data-value');
			item.attr('data-value', data.data.guid);
			item.text(rc.text(data.data.name));
			// Add to workflow menu list
			item_list.append(item.wrap('<li></li>').parent());
			rc.console.debug('*** item', item);
		} catch (message) {
			rc.console.debug('[ERROR]', message);
		}
	});
	// Process data
	rc.context(data.workflows).each(function(at, data) {
		rc.components.insertWorkflow('#rc-workflows-list', data);
	});
	// Process data
	rc.context(data.containers).each(function(at, data) {
		rc.console.debug('.. data.container at : ', at);
		rc.console.debug('.. data.container data : ', data);
		rc.components.insertColumnList('#rc-container-list', data);
	});
	// Process copy-param clicks
	rc.context('.dropdown-menu[data-original-target]').each(function() {
		var name = rc.context(this).attr('data-original-target');
		rc.context(this).find('.rc-cascade-value[data-value="' + name + '"]').click();
	});
	// No form containers?
	if (rc.context('#rc-container-list').is(':empty')) {
		rc.context('#rc-container-list-messages').slideDown();
	} else {
		rc.context('#rc-container-list-messages').slideUp();
	}
	rc.ui.markProcessingDone();// Unmark processing
	rc.context('#rc-ui-icon-unsaved-changes').hide();// Unmark modified
	rc.selectData();// Trigger record selection?
};

// Select record data
rc.selectData = function(deferred, send) {
	rc.console.debug('rc.selectData');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	deferred = deferred || new jQuery.Deferred();
	send = send || {};
	send.__action = rc.actions.selectData;
	rc.components.remoting.send(deferred, send, rc.selectData.done, rc.selectData.fail);
	return deferred.promise();
};

rc.selectData.done = function(deferred, send, recv, meta) {
	rc.console.debug('rc.selectData.done');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	rc.console.debug('.. recv', recv);
	rc.console.debug('.. meta', meta);
	// Assign default values to all the fields
	// This will be overwritten by field data values, if any.
	rc.rollupDefaultValues();
	// Cache form-controls with a name attribute
	var controls = rc.context('.form-control[name]');
	rc.dataModal.BatchUploadModel = $.extend(rc.dataModal.BatchUploadModel, recv);
	// Loop over the received data, and assign to fields as found
	rc.context.each(recv, function(name, data) {
		rc.validateProductSlot(name,data);
		controls.filter('[name="' + name + '"]').val(data);
		if (controls.filter('[name="' + name + '"]').val() == 'true') {
			controls.filter('[name="' + name + '"]').filter('[type="checkbox"]').prop("checked", "checked");
		}
	});
	// render cart products with their quantities
	rc.components.Cart.renderUpsertData(recv);
	rc.components.Attribute.renderUpsertData(recv);
	//restore campaign ask state
	rc.components.CampaignAsk.populateData(recv);
	// render sessions with their quantities
	rc.components.Session.renderUpsertData(recv);
	//if a old record before introducing the giving toggle on form
	var workflowActionGivingFlag = rc.context('[data-cascade="exclude-giving"][is-old="true"]');
	if (workflowActionGivingFlag && workflowActionGivingFlag.length>0) {
		//override the data in exclude-giving flag with that of batch-upload record
		//as workflow action should not overwrite batch-upload record
		if (recv && recv[rc.ns+'exclude_giving__c']) {
			console.log('FOUND THE NAME WITH THE NAMESPACE!');
			rc.context('#rc-workflows-list [data-method="send-data"] [data-cascade="exclude-giving"][data-value="'+recv[rc.ns+'exclude_giving__c'] + '"].btn').click();
		}
	}
	rc.events.trigger("form-loaded-with-data");
};

rc.selectData.fail = function(deferred, send, recv, meta) {
	rc.console.debug('rc.selectData.fail');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	rc.console.debug('.. recv', recv);
	rc.console.debug('.. meta', meta);
};

rc.initializeSessionId = function(isTestMode,sessionId) {
	if (isTestMode == "true") {
		rc.sessionId = rc.litleSessionIdPrefix + '-' + sessionId;
	} else {
		rc.sessionId = rc.litleSessionId;
	}
}

//Events component start
//Product Slots Management
rc.productSlots = [rc.ns+'product_1_product_code__c',rc.ns+'product_2_product_code__c',
	rc.ns+'product_3_product_code__c',rc.ns+'product_4_product_code__c',rc.ns+'product_5_product_code__c',
	rc.ns+'product_6_product_code__c',rc.ns+'product_7_product_code__c',rc.ns+'product_8_product_code__c',
	rc.ns+'product_9_product_code__c',rc.ns+'product_10_product_code__c',rc.ns+'product_11_product_code__c',
	rc.ns+'product_12_product_code__c',rc.ns+'product_13_product_code__c',rc.ns+'product_14_product_code__c',
	rc.ns+'product_15_product_code__c',rc.ns+'product_16_product_code__c',rc.ns+'product_17_product_code__c',
	rc.ns+'product_18_product_code__c',rc.ns+'product_19_product_code__c',rc.ns+'product_20_product_code__c'];
rc.prodMap = {};
rc.prodMap[rc.ns+'product_1_product_code__c'] = rc.ns+'product_1';
rc.prodMap[rc.ns+'product_2_product_code__c'] = rc.ns+'product_2';
rc.prodMap[rc.ns+'product_3_product_code__c'] = rc.ns+'product_3';
rc.prodMap[rc.ns+'product_4_product_code__c'] = rc.ns+'product_4';
rc.prodMap[rc.ns+'product_5_product_code__c'] = rc.ns+'product_5';
rc.prodMap[rc.ns+'product_6_product_code__c'] = rc.ns+'product_6';
rc.prodMap[rc.ns+'product_7_product_code__c'] = rc.ns+'product_7';
rc.prodMap[rc.ns+'product_8_product_code__c'] = rc.ns+'product_8';
rc.prodMap[rc.ns+'product_9_product_code__c'] = rc.ns+'product_9';
rc.prodMap[rc.ns+'product_10_product_code__c'] = rc.ns+'product_10';
rc.prodMap[rc.ns+'product_11_product_code__c'] = rc.ns+'product_11';
rc.prodMap[rc.ns+'product_12_product_code__c'] = rc.ns+'product_12';
rc.prodMap[rc.ns+'product_13_product_code__c'] = rc.ns+'product_13';
rc.prodMap[rc.ns+'product_14_product_code__c'] = rc.ns+'product_14';
rc.prodMap[rc.ns+'product_15_product_code__c'] = rc.ns+'product_15';
rc.prodMap[rc.ns+'product_16_product_code__c'] = rc.ns+'product_16';
rc.prodMap[rc.ns+'product_17_product_code__c'] = rc.ns+'product_17';
rc.prodMap[rc.ns+'product_18_product_code__c'] = rc.ns+'product_18';
rc.prodMap[rc.ns+'product_19_product_code__c'] = rc.ns+'product_19';
rc.prodMap[rc.ns+'product_20_product_code__c'] = rc.ns+'product_20';

rc.getProductSlot = function() {
	if (rc.productSlots.length==0) {return null;}
	return rc.productSlots.shift();
}

rc.emptyProductSlot = function(slot) {
	if (slot && slot!=null && slot!=undefined) {rc.productSlots.push(slot);}
}

rc.occupyProductSlot = function(slot) {
	var index = rc.productSlots.indexOf(slot);
	if (index>-1 && rc.productSlots.length>0) {rc.productSlots.splice(index, 1);};
};

rc.validateProductSlot = function(field,value) {
	var index = rc.productSlots.indexOf(field);
	if (index>-1 && rc.productSlots.length>0) {
		//if code not empty, ie slot not empty, remove from avail queue
		if (value && rc.context.trim(value)!='') {rc.productSlots.splice(index, 1);}
	};
};

rc.getIfProductSlotAvailable = function (slot) {
	return rc.productSlots.indexOf(slot) > -1 && rc.productSlots.length > 1;
}

rc.updateProductSlots = function(component) {
	var type = component.attr("data-component-type");
	var slot;
	if (type=="attribute") {
		slot = component.find(".rc-field-name").attr("name");
		rc.emptyProductSlot(slot);
	} else if (type=="cart") {
		component.find(".product-entry-row[data-product-slot]").each(function(index,slotElem) {
			slot = rc.context(slotElem).attr("data-product-slot");
			if (!slot) {return true;}
			rc.emptyProductSlot(slot);
		});
	} else if (type=="session") {
		component.find(".session-entry-row[data-session-slot]").each(function(index,slotElem) {
			slot = rc.context(slotElem).attr("data-session-slot");
			if (!slot) {return true;}
			rc.emptyProductSlot(slot);
		});
	}
};

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

rc.ui.markProcessing = function() {
	rc.ui.markProcessing.queue.push(true);// Push onto list for tracking
	rc.context('#rc-ui-icon-processing').show();// Update UI
};

rc.ui.markProcessingDone = function(data) {
	if (rc.ui.markProcessing.queue.length == 1) {rc.context('#rc-ui-icon-processing').hide();}
	if (data != null && data.modified == false) {rc.context('#rc-ui-icon-unsaved-changes').hide();}
	rc.ui.markProcessing.queue.pop();
};
rc.ui.markProcessing.queue = [];

rc.ui.setDropdownVisible = function() {
	var mergeFieldsSelector = "  #rc-page-container .rc-component-content [data-field-hidden='true'] .rc-opacity-md "
		+ ", #rc-page-container .rc-component-merge-field-content.rc-opacity-md ";
	rc.context(mergeFieldsSelector).each( function(index, mergeField) {
		mergeField = rc.context(mergeField);
		var childTargetElements = mergeField.find("[data-opacity-target='true'], .rc-field-menu");
		mergeField.removeClass("rc-opacity-md");
		if (childTargetElements.length > 0) {
			childTargetElements.addClass("rc-opacity-md rc-requires-edit");
		}
		if (mergeField.closest(".rc-component-content").hasClass("rc-opacity-md")) {
			mergeField.closest(".rc-component-content").removeClass("rc-opacity-md")
		}
	});
}

rc.ui.setDefaultValue = function(event) {
	rc.console.debug('..rc.ui.setDefaultValue');
	if (rc.getCurrentMode() == 'view') {return true;}
	var source = rc.context(this) || rc.context(event.target);
	var value  = source.val() || '';
	var attribute = source.attr('data-field-default');
	if (source.attr("type") == "checkbox") {
		var booleanValue = source.closest("[data-field-default]").is(":checked") ? true : false;
		source.closest("[data-field-default]").attr("data-field-default", booleanValue);
	} else {
		source.closest("[data-field-default]").attr("data-field-default", value);
	}
	return true;
};

rc.ui.removeRedundantOpacity = function() {
	rc.context("#rc-page-container .rc-default-hidden").each(function(index, element) {
		element = rc.context(this) || '';
		element.removeClass("rc-opacity-md");
		element.find(".fa-eye-slash").remove();
		element.find(".rc-field-text").prepend('<span class="fa fa-fw fa-eye-slash pull-right rc-margin-xs rc-tooltip" data-toggle="tooltip" data-title="Hidden Field"></span>');
		element.find("[data-opacity-target='true']").each(function(index, opacityTarget) {
			opacityTarget = rc.context(opacityTarget) || '';
			if (opacityTarget.hasClass("rc.opacity-md") == true) {
				return true;
			} else {
				opacityTarget.addClass("rc-opacity-md rc-requires-edit");
			}
		});
	});
	rc.context(".rc-toggle-dropdown").addClass("rc-requires-edit");
}

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
	//if the element is disabled don't cascade the value
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

rc.ui.togglePlaceholderForm = function(item, cascadeTarget) {
	rc.console.log('..rc.ui.togglePlaceholderForm');
	rc.console.log('..item : ', item);
	rc.console.log('..cascadeTarget : ', cascadeTarget);
	if (!rc.context(item).hasClass("rc-cascade-placeholder")) {
		rc.console.log('no class!! bout to return');
		return;
	}
	item = rc.context(item) || '';
	cascadeTarget = rc.context(cascadeTarget) || '';
	var placeholderLink = rc.context(rc.context(cascadeTarget).prev().find(".rc-placeholder-link")) || '';
	placeholderLink.trigger("click");
	var dataField = rc.context(cascadeTarget.find(".rc-field-name[placeholder]"));
	var placeholderValue = dataField.attr("placeholder") || '';
	// fill in existing placeholder value
	if (placeholderLink.next('div.popover:visible').length > 0) {
		// popover is visible
		var placeholderField = rc.context(placeholderLink.next().find(".rc-placeholder-content")) || '';
		placeholderField.val(placeholderValue);
	}
	return true;
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

rc.ui.initializePlaceholder = function(component) {
	rc.console.log('..rc.ui.initializePlaceholder: ',component);
	component = rc.context(component) || '';
	rc.context(component.find(".rc-placeholder-link")).each(function(index, link) {
		link = rc.context(link) || '';
		link.popover({html:true,placement:"top",title:function() {
			return rc.context(this).parent().find('.rc-popover-head').html();
		},content: function() {
			return rc.context(this).parent().find('.rc-popover-content').html();
		}});
	});
};

rc.ui.initializePlaceholderEvents = function(component) {
	rc.console.log('..rc.ui.initializePlaceholderEvents: ',component);
	var saveButtonSelector = ".form-group .rc-toggle-placeholder .popover .popover-content .rc-placeholder-footer .rc-placeholder-save";
	var cancelButtonSelector = ".form-group .rc-toggle-placeholder .popover .popover-content .rc-placeholder-footer .rc-placeholder-discard";
	var placeholderInputSelector = ".form-group .rc-toggle-placeholder .popover .popover-content .rc-placeholder-content";
	// Bind events
	rc.context(component.find(".rc-component-content")).on("click", saveButtonSelector, function(event) {
		event.preventDefault();
		rc.ui.savePlaceholderValue(event);
	});
	rc.context(component.find(".rc-component-content")).on("click", cancelButtonSelector, function(event) {
		event.preventDefault();
		rc.ui.discardPlaceholderPopover(event);
	});
	rc.context(component.find(".rc-component-content")).on("keypress", placeholderInputSelector, function(event) {
		// todo: does this confict with javascript at the bottom of the page
		// Save if enter key is pressed
		if (event.which == 13) {
			event.preventDefault();
			rc.ui.savePlaceholderValue(event);
		}
		if (event.which == 27) {rc.ui.discardPlaceholderPopover(event);}
	});
};

rc.ui.savePlaceholderValue = function(event) {
	rc.console.log('rc.ui.savePlaceholderValue');
	var eventTarget = event.target || '';
	var popover = rc.context(rc.context(eventTarget).closest(".popover"));
	popover = popover || '';
	rc.ui.setPlaceholderValue(popover);
	return true;
};

rc.ui.setPlaceholderValue = function(popover) {
	rc.console.debug('rc.ui.setPlaceholderValue');
	var source = rc.context(popover) || '';
	var placeholderField = source.find(".rc-placeholder-content");
	var value = placeholderField.val() || '';
	var targetInputField = source.closest(".rc-toggle-placeholder").next().find("[placeholder]") || '';
	rc.context(targetInputField).attr("placeholder", value);
	source.popover("hide");
	return true;
}

rc.ui.discardPlaceholderPopover = function(event) {
	rc.console.log('rc.ui.discardPlaceholderPopover');
	var eventTarget = event.target || '';
	var popover = rc.context(rc.context(eventTarget).closest(".popover"));
	popover.popover("hide");
	return true;
};

// TODO: this method is called multiple times - is that needed?????
rc.components.initialize = function(component, data) {
	data = data || {};// Check data
	component = rc.context(component);// Check component
	rc.components.renderDataTemplates(component);// Copy templates
	// Copy data-field-name
	component.find('[data-field-name]').each(function() {
		var name = rc.context(this).attr('data-field-name').toLowerCase();
		rc.context(this).find('.rc-field-name').attr('name', name);
	});
	// Copy data-field-text
	component.find('[data-field-text]').each(function() {
		rc.context(this).find('.rc-field-text').text(rc.context(this).attr('data-field-text'));
	});
	// Copy data-field-menu
	component.find('[data-field-menu]').each(function() {
		var name = rc.context(this).attr('data-field-menu');
		var html = rc.context(name).html();
		// Add the menu html to the menu
		menu_group = rc.context(this).find('.rc-field-menu-group');
		menu_group.append('<span class="input-group-addon rc-field-menu"></span>');
		menu_group.find('.rc-field-menu').html(html);
		menu_group.addClass('input-group');
	});
	// Copy data-placeholder
	component.find('[data-placeholder]').each(function() {
		rc.context(this).find('.rc-field-name').attr('placeholder', rc.context(this).attr('data-placeholder'));
	});
	// Copy data-field-hidden
	component.find('[data-field-hidden="true"]').each(function() {
		rc.context(this).addClass('rc-requires-edit rc-opacity-md');
		rc.context(this).find('.rc-field-text').prepend('<span class="fa fa-fw fa-eye-slash pull-right rc-margin-xs rc-tooltip" data-toggle="tooltip" data-title="Hidden Field"></span>');
	});
	// Copy data-required
	component.find('[data-required="true"]').each(function() {
		rc.context(this).find('.input-group').attr('data-required', 'true');
	});
	// Copy data-local-only -- prevents input data from being submitted to remote host
	component.find('[data-local-only="true"]').each(function() {
		var name = rc.context(this).attr('data-field-name').toLowerCase();
		rc.context(this).find('.rc-field-name').removeAttr('name');
		rc.context(this).find('.rc-field-name').attr('data-name', name);
	});
	// Bind common
	component.find('.rc-cascade-selected').on('click', rc.ui.cascadeSelected);
	component.find('.rc-cascade-dropdown-text').on('click', rc.ui.cascadeDropdownText);
	component.find('.rc-cascade-css').on('click', rc.ui.cascadeCss);
	component.find('.rc-cascade-input').on('keyup', rc.ui.cascadeInput);
	component.find('.rc-cascade-input').on('change', rc.ui.cascadeInput);
	component.find('.rc-cascade-input-group').on('click', rc.ui.cascadeInputGroup);
	component.find('.rc-cascade-value').on('click', rc.ui.cascadeValue);
	component.find('.rc-cascade-value-toggle').on('click', rc.ui.cascadeValueToggle);
	component.find('.rc-filter-dropdown').on('keyup', rc.ui.filterDropdown);
	component.find('.rc-toggle-active').on('click', rc.ui.toggleActive);
	component.find('.rc-toggle-primary').on('click', rc.ui.togglePrimary);
	component.find('.rc-toggle-siblings').on('click', rc.ui.toggleSiblings);
	component.find('.rc-tooltip').tooltip();
	component.find('.rc-field-name').on('change', rc.ui.setDefaultValue);
	component.find('.rc-field-name').on('keyup', rc.ui.setDefaultValue);
	if (rc.isPaymentTransactional) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="corduro"]').attr('disabled', 'disabled');
	}
	if (rc.isSageConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="sage"]').removeAttr('disabled');
	}
	if (rc.isHeartlandConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="heartland"]').removeAttr('disabled');
	}
	if (rc.isIATSConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="iATS"]').removeAttr('disabled');
	}
	if (rc.isPayPalConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="PayPal"]').removeAttr('disabled');
	}
	if (rc.isLitleConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="Litle"]').removeAttr('disabled');
		if (rc.isLitleConfiguredForAdvancedFraudDetection) {
			rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('[data-name="Litle"] [data-cascade="data-advanced-fraud-detection"]').removeAttr('disabled');
		}
	}
	if (rc.isAuthDotNetConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="Authorize.net"]').removeAttr('disabled');
	}
	if (rc.isCybersourceConfigured) {
		rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('.rc-payment[data-value="Cybersource"]').removeAttr('disabled');
	}
	// Content editable
	var editable = 'edit' == rc.context('#rc-page-container').attr('data-mode');
	component.find('[contenteditable]').attr('contenteditable', editable);
	component.attr('id', data.guid);// Copy GUID
	// Required input group
	component.find('.input-group[data-required] .rc-marker').off("click").click(function() {
		if (rc.getCurrentMode() == 'edit') {
			var item = rc.context(this).closest('.input-group');
			var required = item.attr('data-required') != 'true';
			item.attr('data-required', required);
		}
	});
	//add event listener to dropdown to detect overflow and flip drop direction
	component.find(".dropdown").on('show.bs.dropdown',rc.ui.flipOverflownDropdown);
	// Listen to changes in form controls, and remove the marker states on the form group
	component.find('.form-control').on('change', rc.upsertData.validate);
};

rc.components.renderDataTemplates = function(component) {
	// Copy templates
	component.find('[data-template]').each(function() {
		var name = rc.context(this).attr('data-template');
		var html = rc.context(name).html();
		//recursively replace templates (if any)
		var templateElem = rc.context(html);
		templateElem = rc.components.renderDataTemplates(templateElem);
		rc.context(this).prepend(templateElem);
	});
	return component;
};

rc.components.pickListValues = function() {
	var responsePickValsArr = null;
	return {
		fillPickListValues : function(keyField) {
			rc.remoting.invokeAction(rc.actions.getPickListInfoMap, rc.ns+'batch_upload__c',this.donefunction);
		},
		donefunction : function(response) {
			responsePickValsArr = response;
			for (var fieldName in responsePickValsArr) {
				if (hasOwnProperty.call(responsePickValsArr, fieldName)) {
					var optionsArray = responsePickValsArr[fieldName] || [] ;
					var picklist = rc.context("select[data-field-name="+fieldName+"]");
					if (!picklist) {continue;}
					picklist.html('');
					rc.context(optionsArray).each(function() {
						picklist.append(rc.context('<option>', {value:this}).text(this));
					});
				}
			}
		},
		populatePicklistValue : function(pickListElem,fieldName) {
			if (responsePickValsArr == null) {
				return pickListElem;
			} else {
				var optionsArray = responsePickValsArr[fieldName] || [];
				pickListElem.html('');
				rc.context(optionsArray).each(function() {
					pickListElem.append(rc.context('<option>', { value : this }).text(this));
				});
			}
		},
		getvals : function() {
			return responsePickValsArr;
		}
	}
} ();// todo: what's this nubin?

rc.components.remoting.send = function(deferred, send, done, fail) {
	send.__campaign = send.__campaign || rc.campaignId;
	send.__mode = send.__mode || rc.getParam('mode');
	send.__form = send.__form || rc.getParam('form') || rc.paramForm || null;
	send.__data = send.__data || rc.getParam('data') || rc.paramData || null;
	deferred = deferred || new jQuery.Deferred();
	done = done || function(send, recv, meta) {};
	fail = fail || function(send, recv, meta) {};
	/* The return below to allow a rejected promise returned from the done handler to trigger the fail() path */
	deferred.done(function(send, recv, meta) {return done(deferred, send, recv, meta);});
	deferred.fail(function(send, recv, meta) {fail(deferred, send, recv, meta);});
	deferred.always(function() {rc.ui.markProcessingDone();});
	rc.remoting.invokeAction(send.__action, send, function(recv, meta) {// Fetch data
		send = send || {};
		recv = recv || {};
		meta = meta || {};
		if (meta.status) {
			deferred.resolve(send, recv, meta);
		} else {
			deferred.reject(send, recv, meta);
		}
	});
	rc.ui.markProcessing();// Update UI
	return deferred.promise();
};

rc.components.insert = function(template, container) {
	var component = rc.context(template).clone();
	component.removeAttr('id');
	component.removeClass('rc-template');
	component.show();
	// Initialize template and elements
	rc.components.initialize(component);
	// Add to container
	rc.context(container).append(component);
	return component;
};

rc.components.importContentCSS = function(component, styles) {
	rc.console.debug('rc.components.importContentCSS', component, styles);
	styles = styles || {};
	// Import
	var component = rc.context(component);
	// Remove any existing css attributes from the component
	// Delete any form attributes starting with css-
	if (component && component.length>0 && component.get(0)) {
		rc.context(component.get(0).attributes).each(function(index, attr) {
			if (attr.name.match('css-')) {
				component.removeAttr(attr.name);
			}
		});
	}
	for (var name in styles) {component.attr('css-' + name, styles[name]);}
};

rc.components.insertWorkflow = function(container, container_data) {
	rc.console.debug('rc.components.insertWorkflow', container_data);
	container_data = container_data || {};
	container_data.actions = container_data.actions || [];
	container_data.data = container_data.data || {};
	container_data.data['guid'] = container_data.data['guid'] || rc.guid();
	// Set attributes
	var item = rc.components.insert('#rc-container-workflow', container, container_data.data);
	var item_content = item.find('.rc-container-workflow-content');
	// Process
	item.find('.rc-workflow-name').val(container_data.data['name']);
	item.find('.rc-workflow-active').prop('checked', container_data.data['active'] == 'true');
	// Data
	item.attr('id', container_data.data['guid']);
	// Actions
	item.find('[data-action="insert"]').on('click', function() {
		var data = {context:'then'};
		rc.components.insertWorkflowAction(item.find('.rc-container-workflow-content'), data);
	});
	// Process data
	rc.context(container_data.actions).each(function(at, data) {
		rc.components.insertWorkflowAction(item.find('.rc-container-workflow-content'), data);
	});

	// No actions? Insert at least one
	if (container_data.actions.length == 0) {
		rc.components.insertWorkflowAction(item.find('.rc-container-workflow-content'), { guid: rc.guid() });
	}
	// Sortable
	item.find('.rc-container-workflow-content').sortable({handle:'.rc-container-handle',opacity:0.5,placeholder:'rc-state-highlight well',revert:true});
	//add event listener to dropdown to detect overflow and flip drop direction
	item.find(".dropdown").on('show.bs.dropdown',rc.ui.flipOverflownDropdown);
	return item;
};

rc.components.insertWorkflowAction = function(container, container_data) {
	rc.console.debug('rc.components.insertWorkflowAction', container_data);
	// Sanity
	container_data = container_data || {};
	container_data.context = container_data.context || 'then';
	container_data.data = container_data.data || {};
	container_data.data['guid'] = container_data.data['guid'] || rc.guid();
	// Javascript: Clean up data?
	if (container_data.method == 'javascript') {
		container_data.data['data'] = rc.html_decode(container_data.data['data']);
	}
	// Set attributes
	var item = rc.components.insert('#rc-component-workflow-action', container, container_data.data);
	item.attr('id', container_data.data['guid']);
	item.on('cascade-value-changed', rc.components.validateWorkflowAction);
	// Disable send payment option if already payment processor is added
	if (container_data.method != 'send-payment' && rc.workflow.hasPaymentProcessor()) {
		item.find('.dropdown-menu a[data-value="send-payment"]').attr("disabled","disabled");
	}
	// Manage content
	var item_content = item.find('.rc-component-workflow-action-content');
	item_content.find('.label[data-value="' + container_data.context + '"]').click();
	item_content.find('[data-cascade="data-method"][data-value="' + container_data.method + '"]').click();
	var item_details = item_content.find('.rc-fg[data-method="' + container_data.method + '"]');
	//refresh copy parameter merge fields list
	rc.components.CopyParameterAction.refreshMergeFieldPicklist(container);
	// what details to process?
	if (container_data.method == 'send-mail') {
		item_details.find('[data-cascade="data-mail-to"]').val(container_data.data['mail-to']);
		item_details.find('[data-cascade="data-mail-reply-to"]').val(container_data.data['mail-reply-to']);
		item_details.find('[data-cascade="data-mail-subject"]').val(container_data.data['mail-subject']);
		item_details.find('[data-cascade="data-mail-body"]').val(container_data.data['mail-body']);
		item_details.find('[data-cascade]').change();
		rc.components.registerMergeFieldAutoComplete(item_details.find('[data-cascade="data-mail-to"]'), rc.getKeys(rc.ui.MergeFieldMap));
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'corduro') {
		item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
		item_details.find('[data-cascade="data-auth-token"]').val(container_data.data['auth-token']);
		item_details.find('[data-cascade="data-auth-only"][data-value="' + container_data.data['auth-only'] + '"]').click();
		item_details.find('[data-cascade="data-test-only"][data-value="' + container_data.data['test-only'] + '"]').click();
		item_details.find('[data-cascade]').change();
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'sage') {
		if (rc.isSageConfigured) {
			item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
			item_details.find('[data-cascade]').change();
		}
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'heartland') {
		if (rc.isHeartlandConfigured) {
			item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
			item_details.find('[data-cascade]').change();
		}
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'iATS') {
		if (rc.isIATSConfigured) {
			item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
			item_details.find('[data-cascade]').change();
		}
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'PayPal') {
		if (rc.isPayPalConfigured) {
			item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
			item_details.find('[data-cascade]').change();
		}
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'Litle') {
		if (rc.isLitleConfigured) {
			item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
			item_details.find('[data-cascade]').change();
			if (rc.isLitleConfiguredForAdvancedFraudDetection) {
				var isAdvancedFraudDetection = container_data.data['advanced-fraud-detection'];
				if (isAdvancedFraudDetection == undefined) {
					item_details.find('[data-cascade="data-advanced-fraud-detection"][data-value="false"]').click();
				} else {
					item_details.find('[data-cascade="data-advanced-fraud-detection"][data-value="' + isAdvancedFraudDetection + '"]').click();
				}
				//check if form is configured for litle fraud check
				var isViewMode = rc.getCurrentMode() == 'view';
				if (isAdvancedFraudDetection) {
					var isAdvancedFraudDetectionTestMode = container_data.data['advanced-fraud-detection-test-mode'];
					if (isAdvancedFraudDetectionTestMode == undefined) {
						item_details.find('[data-cascade="data-advanced-fraud-detection-test-mode"][data-value="false"]').click();
					} else {
						item_details.find('[data-cascade="data-advanced-fraud-detection-test-mode"][data-value="' + isAdvancedFraudDetectionTestMode + '"]').click();
					}
					if (isAdvancedFraudDetectionTestMode == 'true') {
						item_details.find('[data-cascade="data-sessionId"]').val(container_data.data['sessionId']).change();
					}
				}
				rc.initializeSessionId(container_data.data['advanced-fraud-detection-test-mode'],container_data.data['sessionId']);
				if (isViewMode && isAdvancedFraudDetection) {
					//Add profiling tag to form body
					rc.components.insertLitleProfilingTag();
				}
			}
		}
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'Authorize.net') {
		if (rc.isAuthDotNetConfigured) {
		item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
		item_details.find('[data-cascade]').change();
		}
	} else if (container_data.method == 'send-payment' && container_data.data.data == 'Cybersource') {
		if (rc.isCybersourceConfigured) {
			item_details.find('[data-value="' + container_data.data['data'] + '"].btn').click();
			item_details.find('[data-cascade]').change();
		}
	} else if (container_data.method == 'copy-param') {
		item_details.find('.form-control').val(container_data.data['parameter']).change();
		item_details.find('.dropdown-menu').attr('data-original-target', container_data.data['data']);
	} else if (container_data.method == 'send-data') {
		//if undefined or null default value will be true
		if (container_data.data['exclude-giving']==null || container_data.data['exclude-giving']===undefined ){
			container_data.data['exclude-giving'] = false;
			//for backward compatibility, is old record which may have exclude giving flag unset on batch-upload
			item_details.find('[data-cascade="exclude-giving"]').attr("is-old","true");
		}
		if (container_data.data['exclude-events']==null || container_data.data['exclude-events']===undefined ){
			container_data.data['exclude-events'] = true;
		}
		item_details.find('[data-cascade="exclude-giving"][data-value="' + container_data.data['exclude-giving'] + '"].btn').click();
		item_details.find('[data-cascade="exclude-events"][data-value="' + container_data.data['exclude-events'] + '"].btn').click();
	} else {
		item_details.find('.form-control').val(container_data.data['data']);
		item_details.find('.form-control').val(container_data.data['data']).change();
		item_details.find('a[data-value="' + container_data.data['data'] + '"]').click();
	}

	if (rc.isPaymentTransactional) {
		item_content.find('.rc-payment[data-value="corduro"]').attr('disabled', 'disabled');
	}
	if (rc.isSageConfigured) {
		item_content.find('.rc-payment[data-value="sage"]').removeAttr('disabled');
	}
	if (rc.isHeartlandConfigured) {
		item_content.find('.rc-payment[data-value="heartland"]').removeAttr('disabled');
	}
	if (rc.isIATSConfigured) {
		item_content.find('.rc-payment[data-value="iATS"]').removeAttr('disabled');
	}
	if (rc.isPayPalConfigured) {
		item_content.find('.rc-payment[data-value="PayPal"]').removeAttr('disabled');
	}
	if (rc.isLitleConfigured) {
		item_content.find('.rc-payment[data-value="Litle"]').removeAttr('disabled');
		if (rc.isLitleConfiguredForAdvancedFraudDetection) {
			rc.context('div[data-template="#rc-component-workflow-action--send-payment"]').find('[data-name="Litle"] [data-cascade="data-advanced-fraud-detection"]').removeAttr('disabled');
		}
	}
	if (rc.isAuthDotNetConfigured) {
		item_content.find('.rc-payment[data-value="Authorize.net"]').removeAttr('disabled');
	}
	if (rc.isCybersourceConfigured) {
		item_content.find('.rc-payment[data-value="Cybersource"]').removeAttr('disabled');
	}
};

rc.components.validateWorkflowAction = function(event,details) {
	if (details.attribute=="data-method") {
		if (details.value=='send-payment') {
			rc.context('#rc-workflows-list .dropdown-menu a[data-value="send-payment"]').not(rc.context(details.source)).attr("disabled","disabled");
		} else if (details.oldvalue=='send-payment') {
			rc.context('#rc-workflows-list .dropdown-menu a[data-value="send-payment"]').removeAttr("disabled");
		}
	}
	if (details.attribute=="data-value") {
		if (rc.context(this).attr('data-method') == 'send-payment') {
			rc.components.validateCampaignAskSection();
		}
	}
};

rc.components.insertColumnList = function(container, container_data) {
	container_data = container_data || {};
	container_data.data = container_data.data || {};
	container_data.data.columns = parseInt(container_data.data.columns || '1');
	container_data.data['guid'] = container_data.data['guid'] || rc.guid();
	// Set attributes
	var item = rc.components.insert('#rc-container-column-list', container, container_data.data);
	var item_content = item.find('.rc-container-column-list-content');
	item.attr('id', container_data.data['guid']);
	item.attr('data-columns', container_data.data.columns);
	// Apply CSS
	rc.components.importContentCSS(item, container_data.styles);
	rc.components.updateContentCSS(item);
	// Delete columns over a certain position
	rc.components.deleteColumnListColumns(item_content, container_data.data.columns);
	// Insert new columns
	rc.components.upsertColumnListColumns(item_content, container_data.data.columns, container_data.columns);
	// Now, with everything in place, loop over the column data and insert components
	rc.components.upsertColumnListComponents(item_content, container_data.columns);
	// Hide the empty alert message
	rc.context('#rc-container-list-messages').hide();
	return item;
};

rc.components.deleteColumnListColumns = function(container, max_position) {
	rc.context(container).find('.rc-container-column').each(function() {
		var position = parseInt(rc.context(this).attr('data-position') || '999');
		if (max_position < position) {rc.context(this).remove();};
	});
}

rc.components.upsertColumnListColumns = function(container, max_position, column_data) {
	rc.console.debug('rc.components.upsertColumnListColumns', max_position);
	// Check column data
	column_data = column_data || [];
	// Add new items
	rc.context(new Array(max_position)).each(function(position) {
		// Find the old item, if it exists
		var item_selector = '.rc-container-column[data-position="' + position + '"]';
		var item = container.find(item_selector);
		// Sanity check the data
		var data = column_data[position] || {};
		data.data = data.data || {};
		// Insert if needed
		if (item.length == 0) {
			rc.console.debug('.. upserting position', position, 'as', data);
			// Create
			item = rc.components.insert('#rc-container-column', container, data.data);
			container.append(item);
			// Sortable
			item.find('.rc-container-column-content').sortable({
				connectWith:'.rc-container-column-content',handle:'.rc-component-handle',
				opacity:0.5,placeholder:'rc-state-highlight well',revert:true
			});
		}
		// Data properties
		item.attr('data-position', position);
		item.attr('data-size', parseInt(data.data.size) || (12 / max_position));
		// Clean out the old sizes
		item.removeClass('col-sm-1 col-sm-2 col-sm-3 col-sm-4 col-sm-5 col-sm-6 col-sm-7 col-sm-8 col-sm-9 col-sm-10 col-sm-11 col-sm-12');
		item.removeClass('col-md-1 col-md-2 col-md-3 col-md-4 col-md-5 col-md-6 col-md-7 col-md-8 col-md-9 col-md-10 col-md-11 col-md-12');
		item.removeClass('col-lg-1 col-lg-2 col-lg-3 col-lg-4 col-lg-5 col-lg-6 col-lg-7 col-lg-8 col-lg-9 col-lg-10 col-lg-11 col-lg-12');
		// Set the new size
		item.addClass('col-sm-' + item.attr('data-size'));
	});
};

rc.components.upsertColumnListComponents = function(container, column_data) {
	rc.context(column_data).each(function(position, data) {
		rc.console.debug('.. updating column components', data);
		//filter component Data
		data.components = rc.filterComponentData(data.components);
		// Find column
		var data = data || {};
		var item_selector = '.rc-container-column[data-position="' + position + '"]';
		var item = container.find(item_selector);
		var item_content = item.find('.rc-container-column-content');
		// Update contents
		rc.context(data.components).each(function(index, component_data) {
			rc.components.upsertComponent(item_content, component_data);
		});
		rc.components.pickListValues.fillPickListValues();
	});
};

rc.components.upsertComponent = function(container, component_data) {
	// Sanity
	var data = component_data || {};
	data.data = data.data || {};
	data.data['guid'] = data.data['guid'] || rc.guid();
	data.data['customHidden'] = data.data['customHidden'] || false;
	data.type = data.type || '';
	data.styles = data.styles || {};
	data.defaultValues = data.defaultValues || {};
	data.placeholderValues = data.placeholderValues || {};
	// Matching component types
	var insert_map = {};
	insert_map['address'] = rc.components.Address;
	insert_map['advanced-css'] = rc.components.AdvancedCSS;
	insert_map['button'] = rc.components.Button;
	insert_map['campaign-ask'] = rc.components.CampaignAsk;
	insert_map['campaign-product'] = rc.components.CampaignProduct;
	insert_map['campaign-progress'] = rc.components.CampaignProgress;
	insert_map['credit-card'] = rc.components.CreditCard;
	insert_map['internal-javascript'] = rc.components.InternalJavascript;
	insert_map['external-javascript'] = rc.components.ExternalJavascript;
	insert_map['external-stylesheet'] = rc.components.ExternalStylesheet;
	insert_map['html-block'] = rc.components.HtmlBlock;
	insert_map['image'] = rc.components.Image;
	insert_map['jumbotron'] = rc.components.Jumbotron;
	insert_map['merge-field'] = rc.components.MergeField;
	insert_map['simple-header'] = rc.components.SimpleHeader;
	insert_map['simple-text'] = rc.components.SimpleText;
	insert_map['url-link'] = rc.components.URLLink;
	//rcEvents Components
	insert_map['cart'] = rc.components.Cart;
	insert_map['session'] = rc.components.Session;
	insert_map['attribute'] = rc.components.Attribute;
	// Found a match?
	var item_insert = insert_map[data.type] || function() {};
	var item = new item_insert(container, data.data);
	// Apply component placeholder values
	rc.ui.initializePlaceholder(item.component);
	rc.ui.initializePlaceholderEvents(item.component);
	rc.applyPlaceholderAttributeValues(item.component, data.placeholderValues);
	// Apply component default values
	rc.applyDefaultAttributeDefaultValues(item.component, data.defaultValues);
	// Set hidden field attribute and value
	rc.setHiddenFieldAttribute(item.component, data.data['customHidden']);
	// Apply CSS
	rc.components.importContentCSS(item.component, data.styles);
	rc.components.updateContentCSS(item.component);
	// Add to "copy-param" data
	if (data.type == 'merge-field') {
		rc.context('#rc-workflows-list').find('[data-template="#rc-component-workflow-action--copy-param"]').each(function() {
			var template = rc.context('<li><a class="rc-cursor-pointer rc-cascade-dropdown-text rc-cascade-value" data-value=""></a></li>');
			template.find('.rc-cascade-value').on('click', rc.ui.cascadeValue);
			template.find('.rc-cascade-value').attr('data-value', data.data.name);
			template.find('.rc-cascade-value').text(data.data.text);
			template.find('.rc-cascade-dropdown-text').on('click', rc.ui.cascadeDropdownText);
			rc.context(this).find('[data-dropdown-menu="target-fields"]').append(template);
			rc.console.debug('.. adding to copy-param list');
		});
	}
	//initialize validation data
	rc.validateInput.initializeComponentData(container,data);
	// Request remote data?
	if (item.send) {item.send();}
};

rc.components.updateContentCSS = function(component) {
	rc.console.debug('rc.components.updateContentCSS', component);
	// Update from css data
	var component = rc.context(component);
	var component_content = component.find('.rc-content-css').filter(':first');
	//clear the style attribute
	component_content.attr("style","");
	if (component && component.get(0)) {
		rc.context(component.get(0).attributes).each(function(index, attr) {
			if (attr.name.match('css-') && attr.name != 'css-background-image') {
				var name = attr.name.replace('css-', '');
				attr.value = attr.value || '';
				component_content.css(name, attr.value);
			}
			if (attr.name.match('css-') && attr.name == 'css-background-image' && attr.value) {
				component_content.css('background-image', 'url(' + attr.value + ')');
				component_content.css('background-size', 'cover');
				component_content.css('background-position', 'center center');
			}
			//clear background if no value specified for the attribute
			if (attr.name.match('css-') && attr.name == 'css-background-image' && !attr.value) {
				component_content.css('background-image', '');
				component_content.css('background-size', '');
				component_content.css('background-position', '');
			}

			//fix text-decoration not inherited to floated label container descendants
			if (component.attr("css-orientation")==="horizontal" && attr.name==='css-text-decoration') {
				var name = attr.name.replace('css-', '');
				component_content.find('.rc-label-container').css(name, attr.value);
			}
		});
	}
	// Check for hidden fields
	rc.ui.toggleHiddenFields(component);
	// Remove redundant casecaded opacity
	rc.ui.removeRedundantOpacity();
};

rc.components.Button = function(container, data) {
	rc.console.debug('rc.components.Button');
	rc.console.debug('.. container', container);
	rc.console.debug('.. data', data);
	this.container = container;
	this.type = 'Button';
	this.data = data;
	this.component = rc.components.insert('#rc-component-button', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.content.find('.rc-name').text(data.text);
	this.content.find('.rc-icon').addClass(data.icon);
	var workflow_list = this.content.find('.dropdown-menu');// Populate the list of workflows
	rc.context('#rc-workflows-list').find('.rc-container-workflow').each(function() {
		var context = rc.context(this);
		var item = rc.context('<li><a class="rc-cursor-pointer rc-cascade-value rc-cascade-dropdown-text"></a></li>');
		item.find('a').attr('data-cascade', 'data-workflow');
		item.find('a').attr('data-value', context.attr('id')); // guid
		item.find('a').text(context.find('.rc-workflow-name').val());
		// Manually bind
		item.find('a').on('click', rc.ui.cascadeValue);
		item.find('a').on('click', rc.ui.cascadeDropdownText);
		// Add to list
		workflow_list.append(item);
	});
	// Bind to submit to kick off the authorization
	this.content.find('.btn-execute').on('click', rc.components.Button.execute);
	//stop bubble on toggle button
	// Find the specified workflow option and click it
	this.content.find('[data-cascade="data-workflow"][data-value="' + data.workflow + '"]').click();
};

rc.components.Button.execute = function() {
	// Nothing goes above this
	var actionButtonContext = rc.context(this);
	actionButtonContext.prop("disabled",true);
	// All of the below validations should be independent statements, ensuring that each
	// validation method is called, and providing all errors after one click of the button.
	// TODO This would be more de-coupled if the attached components could be iterated for validation
	var v0 = rc.validateInput.isFormValid();
	var v1 = rc.components.CampaignAsk.validateAskValue();
	var v2 = rc.components.Cart.validate();
	var v3 = rc.components.Session.validate();
	var formValid = v0 && v1 && v2 && v3;
	//reenable the local only fields, which were disabled for validation purpose
	//workflows should send local only data to server
	// TODO Perhaps this call should be in rc.validateInput.isFormValid()
	rc.enableLocalOnly(true);
	var workflowToExecuteId = rc.context.trim(rc.context(this).closest('[data-workflow]').attr('data-workflow'));
	if (rc.getCurrentMode() == 'view' && formValid && workflowToExecuteId) {
		rc.workflow.execute(workflowToExecuteId, actionButtonContext);
	} else {
		reenable(actionButtonContext);
	}
}

rc.components.registerMergeFieldAutoComplete = function(field,dataArray) {
	function split(val) {return val.split( /,\s*/ );}
	function extractLast(term) {return split( term ).pop();}
	// don't navigate away from the field on tab when selecting an item
	$(field).bind( "keydown", function(event) {
		if (event.keyCode === $.ui.keyCode.TAB && $(this).data("ui-autocomplete").menu.active) {
			event.preventDefault();
		}
	}).autocomplete({
		minLength: 0,
		source: function(request,response) {
		// delegate back to autocomplete, but extract the last term
		response($.ui.autocomplete.filter(dataArray,extractLast(request.term)));
		},
		focus:function() {return false;},
		select: function(event,ui) {
			var terms = split(this.value);
			// remove the current input
			terms.pop();
			// add the selected item
			terms.push(ui.item.value);
			// add placeholder to get the comma-and-space at the end
			terms.push("");
			this.value = terms.join(", ");
			return false;
		}
	});
};

rc.components.insertLitleProfilingTag = function() {
	//create profiling element, find form body, add profiling element to form body
	var fraudDetectTokenGenHtml = rc.context("#rc-litle-advance-fraud-detection").html();
	var fraudDetectTokenGenEl = rc.context(fraudDetectTokenGenHtml);
	var scriptTag = fraudDetectTokenGenEl.filter("script");
	var iFrameTag = fraudDetectTokenGenEl.filter("iframe");
	var scriptTagUrl = scriptTag.attr("data-lib-src");
	var iFrameTagUrl = iFrameTag.attr("data-lib-src");
	scriptTagUrl += rc.sessionId;
	iFrameTagUrl += rc.sessionId;
	scriptTag.attr("src",scriptTagUrl).attr("data-lib-src","");
	iFrameTag.attr("src",iFrameTagUrl).attr("data-lib-src","");
	rc.context("body:first").prepend(fraudDetectTokenGenEl);
	return fraudDetectTokenGenEl;
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
console.log('FINISHED LOADING rc.js');

rc.initializeParams();// todo: find a better place for this
rc.initializeFormApp();
/*
$(document).on('keyup keypress', 'form input[type="text"]', function(e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		return false;
	}
});
*/
