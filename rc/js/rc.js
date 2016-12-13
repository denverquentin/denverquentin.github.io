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
rc.components.remoting = rc.components.remoting || {};
rc.dataModal = rc.dataModal || {};
rc.workflow = rc.workflow || {};
rc.upsertData = rc.upsertData || {};
rc.sessionId;/* litle Session Id */
var sessionList = {};

rc.initializeFormApp = function() {
	//rc.components.initialize('.page-header');// Initialize actions in the page header
	// Component list sorting
	rc.context('#rc-container-list').sortable({placeholder:'rc-state-highlight well',handle:'.rc-container-handle'});
	rc.context('body').addClass('rc-content-css');/* Make sure the body tag has a css target */
	rc.context('#rc-component-overview--attach-image').on('change',function() {/* Inline image data */
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
	rc.events.on('form-loaded-with-data',function(event) {
		//functions to initialize components which depends on all components + data load
		//here we have guarantee all components and data is loaded
		rc.validateInput.initialize(); /* if validations enabled initialize the scene */
		rc.ui.setDropdownVisible();
		rc.ui.removeRedundantOpacity();
	});
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

rc.initializeViewSelector = function(context,selectDataArray,defaultSelected) {
	var selectedComponentString = context.data['selectedViewComponents'];
	context.data.componentSelectDataArray = [];
	if (selectedComponentString) {context.data.componentSelectDataArray = selectedComponentString.split(",");}
	context.component.find(".view-component-select").select2({data: selectDataArray, placeholder: "Select view components"});
	//if nothing selected atleast title is shown always
	if (!context.data.componentSelectDataArray || context.data.componentSelectDataArray.length==0) {context.data.componentSelectDataArray = defaultSelected;}
	context.component.find(".view-component-select").val(context.data.componentSelectDataArray).trigger("change");
	context.component.find(".view-component-select").on("change", function (event) {
		//re-populate data array based on what is selected currently
		context.data.componentSelectDataArray = context.component.find(".view-component-select").val();
		rc.initializeViewSelector.rerender(context);
	});
};

rc.initializeViewSelector.rerender = function(context) {
	context.data.componentSelectDataArray = !context.data.componentSelectDataArray?[]:context.data.componentSelectDataArray;
	context.component.find(".default-hide").hide();
	//show components selected as view components
	for (var index=0;index<context.data.componentSelectDataArray.length;++index) {
		var viewClass = context.data.componentSelectDataArray[index];
		context.component.find('.'+viewClass).show();
	}
};

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

rc.ui.toggleDisountCode = function() {
	var item = rc.context(this);
	var productRow = rc.context(this).closest(".product-entry-row");
	if (item.hasClass("rc-toggle-discount-code") == true) {
		var dataValue = item.attr("data-value");
		productRow.attr("discount-code-hidden", dataValue);
		productRow.find('.rc-toggle-discount-code[data-value='+dataValue+']').attr("disabled", "disabled").addClass("rc-opacity-md");
		var toggleDiscountCode = dataValue == "false" ? productRow.find('.rc-toggle-discount-code[data-value="true"]') : productRow.find('.rc-toggle-discount-code[data-value="false"]');
		toggleDiscountCode.removeAttr("disabled").removeClass("rc-opacity-md");
		if (dataValue == "false") {
			productRow.find(".discount-code").show();
			productRow.find(".product-discount-code").show();
		} else {
			productRow.find(".discount-code").hide();
			productRow.find(".product-discount-code").hide();
		}
	}
};

rc.ui.toggleDescription = function() {
	var item = rc.context(this);
	var productRow = rc.context(this).closest(".product-entry-row");
	if (item.hasClass("rc-toggle-description") == true ) {
		var dataValue = item.attr("data-value");
		productRow.attr("product-description-hidden", dataValue);
		productRow.find('.rc-toggle-description[data-value='+dataValue+']').attr("disabled", "disabled").addClass("rc-opacity-md");
		var toggleDescription12 = dataValue == "false" ? productRow.find('.rc-toggle-description[data-value="true"]') : productRow.find('.rc-toggle-description[data-value="false"]');
		toggleDescription12.removeAttr("disabled").removeClass("rc-opacity-md");
		if (dataValue == "false") {
			productRow.find(".product-description").show();
		} else {
			productRow.find(".product-description").hide();
		}
	}
};

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

rc.components.MergeField = function(container, data) {
	this.container = container;
	this.type = 'MergeField';
	this.data = data;
	if (data['type'] == 'PICKLIST') {
		this.component = rc.components.insert('#rc-component-merge-field-picklist', this.container, this.data);
		var selectList = this.component.find('.rc-field-name');
		selectList.attr("data-field-name",data.name);
		rc.components.pickListValues.populatePicklistValue(selectList,data.name);
	} else if (data['type'] == 'MULTIPICKLIST') {
		this.component = rc.components.insert('#rc-component-merge-field-picklist', this.container, this.data);
		var selectList = this.component.find('.rc-field-name');
		selectList.attr("data-field-name",data.name);
		selectList.prop('multiple',true);
		rc.components.pickListValues.populatePicklistValue(selectList,data.name);
	} else if (data['type'] == 'BOOLEAN') {
		this.component = rc.components.insert('#rc-component-merge-field-checkbox', this.container, this.data);
	} else {
		this.component = rc.components.insert('#rc-component-merge-field', this.container, this.data);
	}
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	// Update
	this.component.find('.rc-field-text').text(data.text);
	this.component.find('.rc-field-name').attr('name', data.name);
	this.component.find('.rc-field-name').val(data.placeholder);
	this.component.find('.rc-field-menu').remove();
	// Other stuff
	this.component.attr('data-hidden', data['hidden'] ? 'true' : 'false');
	this.component.attr('data-type', data['type']);
	this.component.find('.input-group').attr('data-required', data.required);
};

rc.components.Address = function(container, data) {
	this.container = container;
	this.type = 'Address';
	this.data = data;
	this.component = rc.components.insert('#rc-component-address', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	for (var name in this.data) {// Update
		if (!name.match('req-')) {continue;}
		var key = name.replace('req-','');
		rc.context(this.component).find("[data-field-name='"+key+"'] [data-required]").filter(":first").attr("data-required",this.data[name]);
	}
	this.component.find('[name="'+rc.ns+'address_state__c"]').change(rc.components.Address.populateCountryBasedOnState);
};

rc.components.Address.populateCountryBasedOnState = function(event) {
	var countryInputElem = $(this).closest("div.rc-component-address-content").find('[name="'+rc.ns+'address_country__c"]');
	if (!countryInputElem.length) {return;}
	var stateValue = $.trim($(this).val());
	if (!stateValue) {countryInputElem.val("");return;}
	var isFromPicklist = $(this).closest("div.rc-field-menu-group").find(".dropdown-menu a[data-value='"+stateValue+"']").length;
	if (isFromPicklist>0) {countryInputElem.val("US");} else {countryInputElem.val("");}
};

rc.components.CampaignAsk = function(container, data) {
	this.container = container;
	this.type = 'CampaignAsk';
	this.data = data || {};
	this.data.data = this.data.data || {};
	this.component = rc.components.insert('#rc-component-campaign-ask', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	// Copy text values
	this.component.find('.text-1').text(data['text-1']);
	this.component.find('.text-2').text(data['text-2']);
	// Actions: Required as properties here so that they can access the "this" value
	this.send = rc.components.CampaignAsk.send;
	this.done = rc.components.CampaignAsk.done;
	this.component.find('.input-group').attr('data-required', data.required);
};

rc.components.CampaignAsk.send = function(deferred, send) {
	deferred = deferred || new jQuery.Deferred();
	send = send || {};
	send.__action = rc.actions.selectCampaignAskList;
	rc.components.remoting.send(deferred, send, this.done, this.fail);
	return deferred.promise();
};

rc.components.CampaignAsk.frequencyAmountMinThreshold = { };

rc.components.CampaignAsk.done = function(deferred, send, recv, meta) {
	//ask amounts
	var html = rc.context('#rc-component-campaign-ask-item').html();
	var list = rc.context('.rc-component-campaign-ask-item-list');
	var campaignAskContainer = list.closest(".rc-component-campaign-ask > .rc-component-campaign-ask-content");
	//frequency
	var freqArray = [];
	var freqHtml = rc.context('#rc-component-campaign-ask-freq-item').html();
	var freqList = campaignAskContainer.find(".rc-toggle-primary-container.rc-campaign-ask-frequency-list");
	//other text field
	var askOtherArray = [];
	var otherHtml = rc.context('#rc-component-campaign-ask-other-item').html();
	var otherContainer = campaignAskContainer.find(".rc-component-campaign-ask-other");
	list.empty();
	// Define show/hide functions
	var showOther = function() {
		rc.context('.rc-component-campaign-ask-other').show();
	};
	var hideOther = function() {
		rc.context('.rc-component-campaign-ask-other').hide();
		rc.context('.rc-component-campaign-ask-other input').val('');
		rc.context('.rc-component-campaign-ask-other .rc-error-label').remove();
	};
	// Load results
	rc.context(recv).each(function() {
		var content = rc.cleanKeysToLower(this);
		var givingFrequency = content[rc.ns+'giving_frequency__c'] || '';
		var givingType = content[rc.ns+'giving_type__c'] || '';
		var freq = rc.context(freqHtml);
		freq.removeAttr("id");
		freq.attr("data-show",".rc-amount[data-giving-frequency='" + givingFrequency + "']");
		freq.attr("data-hide",".rc-amount[data-giving-frequency]");
		freq.attr('data-value', givingFrequency);
		freq.text(givingFrequency);
		freq.on('click', hideOther);
		campaignAskContainer.find(".note[data-giving-frequency='" + givingFrequency + "']").show();
		if (!freqArray.length) { freq.removeClass("rc-margin-xs"); }
		freqArray.push(freq);
		if (content[rc.ns+'ask_1_amount__c']) {
			var item = rc.context(html);
			item.removeAttr('id');
			item.attr('data-giving-frequency', givingFrequency);
			item.attr('data-giving-type', givingType);
			item.attr('data-value', content[rc.ns+'ask_1_amount__c']);
			item.text('$' + content[rc.ns+'ask_1_amount__c']);
			item.addClass('rc-editSelection');
			item.on('click', hideOther);
			list.append(item);
		}
		if (content[rc.ns+'ask_2_amount__c']) {
			var item = rc.context(html);
			item.removeAttr('id');
			item.attr('data-giving-frequency', givingFrequency);
			item.attr('data-giving-type', givingType);
			item.attr('data-value', content[rc.ns+'ask_2_amount__c']);
			item.text('$' + content[rc.ns+'ask_2_amount__c']);
			item.addClass('rc-editSelection');
			item.on('click', hideOther);
			list.append(item);
		}
		if (content[rc.ns+'ask_3_amount__c']) {
			var item = rc.context(html);
			item.removeAttr('id');
			item.attr('data-giving-frequency', givingFrequency);
			item.attr('data-giving-type', givingType);
			item.attr('data-value', content[rc.ns+'ask_3_amount__c']);
			item.text('$' + content[rc.ns+'ask_3_amount__c']);
			item.addClass('rc-editSelection');
			item.on('click', hideOther);
			list.append(item);
		}
		if (content[rc.ns+'ask_4_amount__c']) {
			var item = rc.context(html);
			item.removeAttr('id');
			item.attr('data-giving-frequency', givingFrequency);
			item.attr('data-giving-type', givingType);
			item.attr('data-value', content[rc.ns+'ask_4_amount__c']);
			item.text('$' + content[rc.ns+'ask_4_amount__c']);
			item.addClass('rc-editSelection');
			item.on('click', hideOther);
			list.append(item);
		}
		if (content[rc.ns+'ask_5_amount__c']) {
			var item = rc.context(html);
			item.removeAttr('id');
			item.attr('data-giving-frequency', givingFrequency);
			item.attr('data-giving-type', givingType);
			item.attr('data-value', content[rc.ns+'ask_5_amount__c']);
			item.text('$' + content[rc.ns+'ask_5_amount__c']);
			item.addClass('rc-editSelection');
			item.on('click', hideOther);
			list.append(item);
		}
		if (content[rc.ns+'ask_other__c']) {
			var item = rc.context(html);
			item.removeAttr('id');
			item.attr('data-giving-frequency', givingFrequency);
			item.attr('data-giving-type', givingType);
			item.text('Other..');
			item.addClass('rc-editSelection');
			item.on('click', showOther);
			list.append(item);
			var otherElem = rc.context(otherHtml);
			otherElem.attr('data-giving-frequency', givingFrequency);
			otherElem.attr('data-giving-type', givingType);
			askOtherArray.push(otherElem);
		}
		//Note: Keeping minimum threshold amound in map to validate other amount when submitting the form.
		rc.components.CampaignAsk.frequencyAmountMinThreshold[content[rc.ns+'giving_frequency__c']] = content[rc.ns+'minimum_amount_threshold__c'];
	});
	freqList.empty();
	otherContainer.empty();
	if (freqArray && freqArray.length > 0) {freqArray[0].removeClass('');}
	freqList.append(freqArray);
	otherContainer.append(askOtherArray);
	if (recv.length == 0) {list.append('<div class="alert alert-warning">No ask values configured!</div>');}
	rc.components.initialize(campaignAskContainer);
	// Set the first one active
	rc.context('.rc-campaign-ask-frequency-list .btn').filter(':first').click();
	// Validate CampaignAsk section against payment Processor
	rc.components.validateCampaignAskSection();
};

rc.components.CampaignAsk.getAskValueFromMergeFields = function(result) {
	result['finalAmount'] = 0;
	//check if giving frequenncy field is exist on the page
	var isGivingFrequencyMergeField = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_frequency__c"]').val() != undefined ? true : false;
	//check if giving amount field is exist on the page
	var isGivingAmountMergeField = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_amount__c"]').val() != undefined ? true : false;
	if ((isGivingFrequencyMergeField == true && isGivingAmountMergeField == false) || (isGivingFrequencyMergeField == false && isGivingAmountMergeField == true)) {
		return null;
	}
	var givingMergeFieldsPresent = isGivingFrequencyMergeField && isGivingAmountMergeField ? true : false;
	//NOTE: checking givingMergeFieldsPresent flag in else case if required giving merge fields are present on the page to make payment 
	if (givingMergeFieldsPresent == true) { 
		result['finalAmount'] = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_amount__c"]').val() || "0.0";
		result['frequency'] = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_frequency__c"]').val() || '';
		return result;
	} else {
		return null;
	}
};

rc.components.CampaignAsk.populateUpsertData = function(send) {
	var askAmount = rc.components.CampaignAsk.getAskValue();
	if (askAmount && askAmount.frequency) {
		send[rc.ns+'giving_giving_frequency__c'] = askAmount.frequency;
		if (askAmount.finalAmount) {send[rc.ns+'giving_giving_amount__c'] = askAmount.finalAmount;}
		if (askAmount.frequency != rc.givingFreqOnePymt) {
			send[rc.ns+'giving_is_sustainer__c'] = 'true';
		} else {
			send[rc.ns+'giving_is_sustainer__c'] = 'false';
		}
	}
	return send;
};

rc.components.CampaignAsk.getAskValue = function() {
	var campaignAsk = rc.components.CampaignAsk.getComponentAskValue();
	//if component is not on the page, read data from the model
	if ((campaignAsk==null || !campaignAsk) && rc.dataModal.BatchUploadModel) {
		campaignAsk = {};
		campaignAsk['frequency'] = rc.dataModal.BatchUploadModel[rc.ns+'giving_giving_frequency__c'];
		campaignAsk['finalAmount'] = rc.dataModal.BatchUploadModel[rc.ns+'giving_giving_amount__c'];
	} 
	//if data not defined return null
	if (!campaignAsk['frequency'] || campaignAsk['frequency'] == '' || !campaignAsk['finalAmount'] || campaignAsk['finalAmount']=='') {
		return null;
	}
	return campaignAsk;
};

rc.components.CampaignAsk.getComponentAskValue = function() {
	var result = {};
	result['finalAmount'] = 0;
	var frequencyList = rc.context('#rc-container-list .rc-campaign-ask-frequency-list');
	if (!frequencyList || frequencyList.length==0) {
		//Check merge fields if campaign ask is not present. The priority will always be remained for Campaign ask even if giving fields are exist.
		result = rc.components.CampaignAsk.getAskValueFromMergeFields(result);
		return result;
	}
	if (frequencyList) {
		var frequency = frequencyList.find('.btn-primary').attr('data-value');
		result['frequency'] = frequency;
		var amountList = rc.context('.rc-component-campaign-ask-item-list');
		var finalAmount = 0;
		if (amountList) {
			var amount = amountList.find('[data-giving-frequency="'+frequency+'"]').parent().find('[data-giving-frequency="'+frequency+'"].btn-primary').attr('data-value');
			if (amount) {
				finalAmount = amount;
			} else {
				var amountOtherSelected = amountList.find('[data-giving-frequency="'+frequency+'"]').parent().find('[data-giving-frequency="'+frequency+'"].btn-primary');
				if (amountOtherSelected.length) {
					var otherAmount = rc.context('.rc-component-campaign-ask-other').find('[data-giving-frequency="'+frequency+'"].input-group').find('.form-control').val();
					if (otherAmount) {finalAmount = otherAmount;}
				}
			}
			result['finalAmount'] = finalAmount;
		}
	}
	return result;
};

rc.components.CampaignAsk.validateMergeFieldsAskValue = function() {
	//check if giving frequenncy field is exist on the page
	var isGivingFrequencyMergeField = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_frequency__c"]').val() != undefined ? true : false;
	//check if giving amount field is exist on the page
	var isGivingAmountMergeField = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_amount__c"]').val() != undefined ? true : false;
	//if fields are not present on the form
	if (isGivingFrequencyMergeField == false && isGivingAmountMergeField == false) {return true;}
	var isGivingAmountRequired = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_amount__c"]').closest('.input-group').attr('data-required');
	var amount = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_amount__c"]').val();
	if (isGivingAmountRequired == "true" && parseInt(amount) == 0) {
		rc.ui.showMessagePopup(rc.ui.ERROR, 'Please enter giving amount and retry.');
		return false;
	}
	return true;
};

// Validate Campaign Ask amount entered
rc.components.CampaignAsk.validateAskValue = function() {
	var askValue = rc.components.CampaignAsk.getAskValue();
	var componentElem = rc.context("#rc-container-list .rc-component-campaign-ask");
	var messageTypeElement = rc.context("#rc-container-list .rc-component-campaign-ask .message-header");
	var messageText = "Donation amount is not selected. Please select and resubmit.";
	var isRequired = rc.context("#rc-container-list .rc-component-campaign-ask").find('.input-group').attr('data-required');
	//if no ask amount field added dont throw error
	if (componentElem.length == 0) {return true;}
	if (isRequired == "true" && (askValue == null || askValue.finalAmount==0)) {
		messageTypeElement.text(rc.ui.MessageHeaders[rc.ui.ERROR] + ' ');
		componentElem.find(".ask-validation-error").show(); //show error message
		rc.ui.showMessagePopup(rc.ui.ERROR,messageText);
		return false;
	} else {
		messageTypeElement.text('');
		componentElem.find(".ask-validation-error").hide();// hide error messages
		var exist = rc.context(componentElem).find(".component-alert .message-text:contains("+messageText+")");
		if (exist.length) {exist.closest(".component-alert ").remove();}
	}
	return true;
};

rc.components.CampaignAsk.populateData = function(data) {
	var frequency = data[rc.ns+'giving_giving_frequency__c'];
	var amount = data[rc.ns+'giving_giving_amount__c'];
	amount = parseFloat(amount,10);
	var frequencyList = rc.context('#rc-container-list .rc-campaign-ask-frequency-list');
	if (!frequencyList.length || !frequency) {return;}
	frequencyList.find("[data-value='"+frequency+"']").click();
	var amountList = rc.context('.rc-component-campaign-ask-item-list');
	amountList.find('[data-giving-frequency="'+frequency+'"][data-value="'+amount+'"]').click();
}

/* start event javascript */
rc.components.Attribute = function(container, data) {
	this.container = container;
	this.type = 'attribute';
	this.data = data;
	this.component = rc.components.insert('#rc-component-cm-attribute', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	// Actions: Required as properties here so that they can access the "this" value
	this.send = rc.components.Attribute.send;
	this.done = rc.components.Attribute.done;
	this.render = rc.components.Attribute.render;
};

rc.components.Attribute.send = function(deferred, send) {
	deferred = deferred || new jQuery.Deferred();
	send = send || {};
	send.__action = rc.actions.selectCampaignMemberAttributeList;
	// Done and fail
	rc.components.remoting.send(deferred, send, rc.context.proxy(this.done,this),this.fail);
	// Done
	return deferred.promise();
};

rc.components.Attribute.done = function(deferred, send, recv, meta) {
	var data = this.data;
	var defaultOptionElement = rc.context("<option/>", {
		value:"",
		text:"Select Attribute",
		selected:true
	});
	var attribute;
	var optionList = [defaultOptionElement];
	for (var index=0;index<recv.campaignMemberAttributeList.length;++index) {
		attribute = recv.campaignMemberAttributeList[index];
		var optionElement = rc.context("<option/>", {
			value:attribute.Id,
			text:attribute.type
		});
		rc.context.data(optionElement[0],'data',attribute);
		optionList.push(optionElement);
	}
	this.component.find(".attribute-select").html("").append(optionList).val("").change(rc.context.proxy(this.render,this));
	this.component.find(".attribute-select").val(data.attribute_id);
	this.component.find(".attribute-select").trigger("change");
};

rc.components.Attribute.render = function(event) {
	//get selected option & clear label
	var data = this.data;
	this.component.find(".rc-label-container label").text("");
	this.component.find(".rc-value-container").html("");
	var selectedOption = this.component.find(".attribute-select").find(":selected");
	if (!selectedOption || selectedOption.length==0 || selectedOption.attr("value")=='') {return true;}
	var attributeData  = rc.context.data(selectedOption[0],'data');
	if (!attributeData) {return true;}
	//if slot saved and used remove it from empty slot list
	if (this.data.productSlot) {rc.occupyProductSlot(this.data.productSlot);}
	//load existing product slot or get a new one
	var productSlot = this.data.productSlot || rc.getProductSlot();
	//update productslot to data
	this.data.productSlot = productSlot;
	if (!productSlot) {
		rc.ui.showMessagePopup(rc.ui.ERROR,'Maximum allowed attributes added !');
		return true;
	}
	//set label value
	this.component.find(".rc-label-container label").text(rc.html_decode(attributeData.type));
	//depending on type render the attribute and populate the value
	if (attributeData.attributeDataType &&  attributeData.attributeDataType.toLowerCase() == 'picklist') {
		//get template
		var picklistTemplateHTML = rc.context('#rc-component-merge-field-picklist .rc-value-container').html();
		this.component.find(".rc-value-container").html(picklistTemplateHTML);
		var selectList = this.component.find('.rc-field-name');
		var optionList = [];
		for (var index=0;index<attributeData.options.length;++index) {
			var optionElement = rc.context("<option />", {
				value:rc.context.trim(rc.html_decode(attributeData.options[index])),
				text:rc.context.trim(rc.html_decode(attributeData.options[index]))
			});
			optionList.push(optionElement);
		}
		var defaultOptionElement = rc.context("<option/>", {value:"",text:"Select Value"});
		selectList.append(optionList).prepend(defaultOptionElement);
	} else if (attributeData.attributeDataType && attributeData.attributeDataType.toLowerCase() == 'checkbox') {
		var checkboxTemplateHTML = rc.context('#rc-component-merge-field-checkbox .rc-value-container').html();
		this.component.find(".rc-value-container").html(checkboxTemplateHTML);
	} else if (attributeData.attributeDataType && attributeData.attributeDataType.toLowerCase() == 'date') {
		//keep the default which is a text field   
		var checkboxTemplateHTML = rc.context('#rc-component-cm-attribute .rc-value-container').html();
		this.component.find(".rc-value-container").html(checkboxTemplateHTML);         
		this.component.find("input.form-control").datepicker({orientation:"bottom"});
		//initialize datepicker
	} else {
		//keep the default which is a text field   
		var checkboxTemplateHTML = rc.context('#rc-component-cm-attribute .rc-value-container').html();
		this.component.find(".rc-value-container").html(checkboxTemplateHTML);         
	}
	this.component.find(".form-control").attr("name",productSlot);
	this.component.find('.input-group').attr('data-required', data.required);//set required flag from data
	rc.components.initialize(this.component.find(".rc-value-stub-container"));//initialize the component
	return true;
};

rc.components.Attribute.populateUpsertData = function(send) {
	var attributeInputList = rc.context(".rc-component-cm-attribute .rc-value-container .rc-field-name");
	rc.context(attributeInputList).each(function(index,attributeInput) {
		attributeInput = rc.context(attributeInput);
		var productSlot = attributeInput.attr("name");
		if (!productSlot) {return true;}
		var fieldNamePrefix = rc.prodMap[productSlot];
		var productId = attributeInput.closest(".rc-component-cm-attribute").find(".attribute-select").val();
		var value = "";
		if (attributeInput.attr("type") == "checkbox") {
			value = ""+attributeInput.is(":checked");
		} else {
			value = attributeInput.val();
		}
		var productType = 'Attribute';
		send[productSlot] = productId+':'+value;
		send[fieldNamePrefix+'_type__c'] = productType;
	});
	return send;
};

rc.components.Attribute.renderUpsertData = function(send) {
	var productSlotList = rc.getKeys(rc.prodMap);
	for (var index=0;index<productSlotList.length;++index) {
		var productSlot = productSlotList[index];
		var prefix = rc.prodMap[productSlot];
		var productId = send[productSlot];
		//if type to be managed by attribute component
		if (!!productId && send[prefix+'_type__c'] == 'Attribute') {
			var slotArray = productId.split(":");
			productId = slotArray[0];
			var value = slotArray[1] || "";
			for (var i=2;i<slotArray.length;++i) {
				if (slotArray[i]) {
					value = value+":"+slotArray[i];
				}
			}
			value = rc.html_decode(value);
			//find product row
			var productElem = rc.context(".rc-component-cm-attribute-content .attribute-select").find("option[value='"+productId+"']:selected");
			if (!productElem || productElem.length==0) {continue;}
			var component = productElem.closest(".rc-component-cm-attribute");
			if (component.find(".rc-field-name").attr("type") == "checkbox") {
				if (value == "true") {
					component.find(".rc-field-name").prop('checked', true);
				} else {
					component.find(".rc-field-name").prop('checked', false);
				}
			} else {
				component.find(".rc-field-name").val(value).attr("name",productSlot);
				component.find("select.rc-field-name option[value='" + value +"']").attr("selected","selected");
			}
		}
	}
};


rc.components.Cart = function(container, data) {
	this.container = container;
	this.type = 'cart';
	this.data = data;
	this.component = rc.components.insert('#rc-component-cart', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	data.header = data.header || "Shopping Cart";
	this.component.find('.cart-header-text').text(data.header);
	// Actions: Required as properties here so that they can access the "this" value
	this.send = rc.components.Cart.send;
	this.done = rc.components.Cart.done;
	this.getOptionGroup = rc.components.Cart.getOptionGroup;
	this.appendProductRow = rc.components.Cart.appendProductRow;
	this.recalculateTotal = rc.components.Cart.recalculateTotal;
	this.refreshEmptyCartMessage = rc.components.Cart.refreshEmptyCartMessage;
	this.isValidPurchaseQuantity = rc.components.Cart.isValidPurchaseQuantity;
	this.calculateProductDiscountCode = rc.components.Cart.calculateProductDiscountCode;
	this.initialize = rc.components.Cart.initialize;
	this.idProductMap = {};
	rc.context(this.component).on('recalculate-sum',rc.context.proxy(this.recalculateTotal,this));
	this.component.find('.input-group').attr('data-required', data.required);
};

rc.components.Cart.getPaymentDetails = function() {
	var cartPaymentDetails = rc.components.Cart.getComponentPaymentDetails();
	//if component is not configured then get details from the model
	if (cartPaymentDetails==null || !cartPaymentDetails) {
		cartPaymentDetails = {};
		cartPaymentDetails['frequency'] = 'One Payment';
		cartPaymentDetails['finalAmount'] = rc.dataModal.BatchUploadModel[rc.ns+'event_purchase_giving_amount__c'];
	}
	//if data not defined return null
	if (!cartPaymentDetails['finalAmount'] || cartPaymentDetails['finalAmount']=='') {
		return null;
	}
	return cartPaymentDetails;
};

rc.components.Cart.getComponentPaymentDetails = function() {
	if (rc.context("#rc-container-list .rc-component-cart .products-total-amount").length==0) {return null;}
	var result = {};
	result.finalAmount = 0;
	var total = 0.0;
	rc.context("#rc-container-list .rc-component-cart .products-total-amount").each(function(index,amountElem) {
		var value = parseFloat(rc.context(amountElem).attr("total-sum"));
		if (value) {total+=value;}
	});
	result.finalAmount = total;
	result.frequency='One Payment';//Event Meals/Tickets/Items purchase will be 'One payment'
	return result;
};

rc.components.Cart.validate = function() {
	var flag = false;
	var messageText = "Product quantity is not selected. Please select and resubmit.";
	var messageTypeElement = rc.context("#rc-container-list .rc-component-cart .rc-component-cart-content .cart-validation-error .message-header");
	rc.context("#rc-container-list .rc-component-cart").find('.input-group[data-required="true"]').closest('.rc-component-cart').each(function(i, cartComponent) {
		var totalQuantity = 0;
		rc.context(cartComponent).find('.product-quantity').each(function(index, quantity) {
			var value = parseInt(rc.context(quantity).attr("aria-valuenow"));
			if (value) {totalQuantity += value;}
		});
		if (parseInt(totalQuantity,10) == 0) {
			flag = true;
			rc.context('#rc-container-list .rc-component-cart .product-quantity').closest('.form-group').toggleClass('has-error', present == false);
			var present = flag == true ? false : true;
			var componentElem = rc.context(cartComponent);
			messageTypeElement.text(rc.ui.MessageHeaders[rc.ui.ERROR] + ' ');
			componentElem.find(".cart-validation-error").show();
		} else {
			rc.context('#rc-container-list .rc-component-cart .product-quantity').closest('.form-group').toggleClass('has-error', false);
			var componentElem = rc.context(cartComponent);
			messageTypeElement.text('');//hide error messages
			var exist=rc.context(componentElem).find(".component-alert .message-text:contains("+messageText+")");
			if (exist.length) {exist.closest(".component-alert ").remove();}
		}
	});
	if (flag == true) {
		rc.ui.showMessagePopup(rc.ui.ERROR, messageText);
		return false;
	} else {
		return true;
	}
};

rc.components.Cart.recalculateTotal = function(event) {
	var totalSum = 0.0;
	var component = $(this.component);
	this.component.find(".product-entry-row").each(function(index,row) {
		var product = rc.context.data(row,'product');
		var price = product.purchasePrice;
		var quantityText = $(row).find('input.product-quantity').val();
		var quantity = !parseInt(quantityText,10) ? 0 : parseInt(quantityText,10);
		var discountCode = rc.context(row).find(".product-discount-code");
		var discountedAmount = rc.context(discountCode).data('discountedAmount');
		if (discountedAmount) {
			totalSum += (parseFloat(discountedAmount, 10) * quantity);
		} else {
			totalSum += (price * quantity);
		}
	});
	this.component.find(".products-total-amount").text(totalSum.formatMoney(2)).attr("total-sum",totalSum);
};

rc.components.Cart.send = function(deferred, send) {
	deferred = deferred || new jQuery.Deferred();
	send = send || {};
	send.__action = rc.actions.selectProductList;
	rc.components.remoting.send(deferred, send, rc.context.proxy(this.done,this),this.fail);
	return deferred.promise();
};

rc.components.Cart.done = function(deferred, send, recv, meta) {
	//create select elements in cart-select
	var selectElem = this.component.find(".cart-select");
	//clear it out
	selectElem.empty();
	var campaignEvent = recv;
	campaignEvent.name = 'Parent Event';
	selectElem.append(this.getOptionGroup(campaignEvent));
	for (var index=0;index<campaignEvent.sessionList.length;++index) {
		var session = campaignEvent.sessionList[index];
		selectElem.append(this.getOptionGroup(session));
	}
	this.component.find(".cart-select").select2({placeholder:"Select a Product"});
	var that = this;
	this.component.find(".add-product").click(function(event) {
		var selectedOption = $(this).closest(".rc-component-cart").find(".cart-select option:selected")[0];
		var product = rc.context.data(selectedOption,'product');
		product.quantity = 0;
		that.appendProductRow(product);
		that.initialize();
		event.preventDefault();
		return false;
	});
	var ticketCount = 0;
	var itemCount = 0;
	var mealCount = 0;
	//empty the section if it has any values
	this.component.find(".panel-body").html("");
	//add products already selected via data/json
	var savedProductsText = this.data["selectedProducts"];
	if (savedProductsText && this.idProductMap && rc.getKeys(this.idProductMap).length>0) {
		savedProductsText = $(document.createElement('span')).html(savedProductsText).text();
		var selectedProductsArr = JSON.parse(savedProductsText);
		for (var index=0;index<selectedProductsArr.length;++index) {
			var productSavedData = selectedProductsArr[index];
			if (!productSavedData) {continue;}
			var productRecord = this.idProductMap[productSavedData.id];
			productRecord.quantity = productSavedData.def_quantity ? productSavedData.def_quantity : 0;
			productRecord.productSlot = productSavedData.productSlot;
			productRecord.hideProductDescription = productSavedData.hideProductDescription;
			productRecord.hideDiscountCode = productSavedData.hideDiscountCode;
			if (productSavedData.creatGivingProduct!=null) {
				productRecord.creatGivingProduct = productSavedData.creatGivingProduct;
			} else {
				productRecord.creatGivingProduct = "true";
			}
			that.appendProductRow(productRecord);
		}
	}
	//if section is empty append info panel
	this.refreshEmptyCartMessage();
	this.initialize();
};

rc.components.Cart.initialize = function() {
	this.component.find(".panel-body .product-entry-row").each(function(index,productRow) {
		var createGiving = rc.context(productRow).attr("create-giving-product");
		rc.context(productRow).find('[data-cascade="data-create-giving-product"][data-value="'+createGiving+'"]').click();
		var isProductDescriptionHidden = rc.context(productRow).attr("product-description-hidden") == "true" ? "true" : "false";
		rc.context(productRow).find('.rc-toggle-description[data-value='+isProductDescriptionHidden+']').attr("disabled", "disabled");
		rc.context(productRow).find('.rc-toggle-description[data-value='+isProductDescriptionHidden+']').addClass("rc-opacity-md");
		if (isProductDescriptionHidden == "true") {
			rc.context(productRow).find(".product-description").hide();
		} else {
			rc.context(productRow).find(".product-description").show();
		}
		//RCSBIRD-15502
		var isDiscountCodeHidden = rc.context(productRow).attr("discount-code-hidden") == "true" ? "true" : "false";
		rc.context(productRow).find('.rc-toggle-discount-code[data-value='+isDiscountCodeHidden+']').attr("disabled", "disabled");
		rc.context(productRow).find('.rc-toggle-discount-code[data-value='+isDiscountCodeHidden+']').addClass("rc-opacity-md");
		if (isDiscountCodeHidden == "true") {
			rc.context(productRow).find(".discount-code").hide();
			rc.context(productRow).find(".product-discount-code").hide();
		} else {
			rc.context(productRow).find(".discount-code").show();
			rc.context(productRow).find(".product-discount-code").show();
		}
	});
};

rc.components.Cart.refreshEmptyCartMessage = function() {
	var rowCount = this.component.find(".panel-body .row").length;
	if (rowCount==0) {
		var msgElem = rc.context(rc.context("#rc-component-cart-empty-cart-msg").html());
		this.component.find(".panel-body").append(msgElem);
	}
};

rc.components.Cart.getOptionGroup = function(campaignEvent) {
	if (!campaignEvent.productList || campaignEvent.productList.length==0) {return null;}
	campaignEvent.name = !campaignEvent.name ? 'Event' : campaignEvent.name;
	var optGroup = rc.context('<optgroup label="" />');
	optGroup.attr("label",campaignEvent.name);
	for (var index=0;index<campaignEvent.productList.length;++index) {
		var product = campaignEvent.productList[index];
		var optionElement = rc.context("<option/>", {value:product.Id,text:product.type +' : '+product.name});
		this.idProductMap[''+product.Id] = product;
		rc.context.data(optionElement[0],'product',product);
		optGroup.append(optionElement);
	}
	return optGroup;
};

rc.components.Cart.isProductAlreadyAdded = function(product) {
	var productElem = rc.context(".rc-component .rc-component-cart-content .product-entry-row[data-product-id='"+product.Id+"']");
	if (productElem.length>0) {//If product already added just increment its quantity
		product.quantity = parseInt(productElem.find("input.default-quantity").val(),10);
		product.quantity = !product.quantity ? 1 : product.quantity + 1;
		productElem.find("input.default-quantity").val(product.quantity).trigger("change");
		return productElem;
	}
	return null;
};

rc.components.Cart.isValidPurchaseQuantity = function(row) {
	var productRow = rc.context(row);
	var purchaseLimit = productRow.attr("data-purchase-limit");
	//if purchase limit not defined assume its infinite
	if (!purchaseLimit) {return true;}
	purchaseLimit = parseInt(purchaseLimit, 10);
	var currentQuantity = productRow.find(".product-quantity").val();
	currentQuantity = currentQuantity ? parseInt(currentQuantity,10) : 0;
	if (currentQuantity>purchaseLimit) {
		productRow.addClass("quantity-limit-error");
		productRow.find(".product-quantity").val(purchaseLimit).trigger("change");
		return false;
	}
};

rc.components.Cart.appendProductRow = function(product) {
	if (!product) {return;}
	var that = this;
	var component = rc.context(this.component);
	var foundRow = rc.components.Cart.isProductAlreadyAdded(product);
	if (foundRow!=null) {
		rc.ui.showMessagePopup(rc.ui.INFO,'Product already added to form, Default quantity updated (+1) to '+product.quantity);
		return;
	}
	//if already maximum items added throw error
	var currentCount = rc.context(".rc-component-cart-content .product-entry-row[data-product-type='"+product.type+"']").length;
	if (currentCount>=rc.maxProductCount) {
		rc.ui.showMessagePopup(rc.ui.ERROR,'Maximum allowed count for product type:'+product.type+', reached!');
		return;
	}
	var productSlotId = null;
	if (product.productSlot && product.productSlot!='') {
		// Get if the product slot is available, if yes then allocate
		if (!rc.getIfProductSlotAvailable(product.productSlot)) {
			productSlotId = rc.getProductSlot();
		} else {// ...else get a new product slot
			rc.validateProductSlot(product.productSlot,'stub');
			productSlotId = product.productSlot;
		}
	} else {//if product slot not assigned, get a new one
		//Need update here : use product slot only when utmost necessary
		productSlotId = rc.getProductSlot();
	}
	if (!productSlotId) {
		rc.ui.showMessagePopup(rc.ui.ERROR,'Maximum allowed products added !');
		return;
	}
	//if first row, clear out messages.
	if (component.find(".panel-body .row").length == 0) {
		component.find(".panel-body").html("");
	}
	var rowTemplate = rc.context(rc.context("#rc-component-cart-row-template").html());
	product.quantity = product.quantity || 0;
	//select logo
	if (product.type == product.TYPE_TICKET) {
		rowTemplate.find(".product-logo i").addClass("fa-ticket");
	} else if (product.type == product.TYPE_MEAL) {
		rowTemplate.find(".product-logo i").addClass("fa-cutlery");
		//RCSBIRD-15502
		rowTemplate.find(".dropdown").hide();
		rowTemplate.find(".discount-code-element").hide();
	} else if (product.type == product.TYPE_ITEM) {
		rowTemplate.find(".product-logo i").addClass("fa-gift");
		//RCSBIRD-15502
		rowTemplate.find(".dropdown").hide();
		rowTemplate.find(".discount-code-element").hide();
	}
	rowTemplate.attr("data-product-type",product.type);
	rowTemplate.attr("data-product-id",product.Id);
	rowTemplate.attr("data-product-slot",productSlotId);
	rowTemplate.attr("data-purchase-limit",product.purchaseLimit);
	rowTemplate.find(".product-name").text(product.name);
	//.product-name
	rowTemplate.find(".product-description").text(product.description);
	//RCSBIRD-14521
	product.purchasePrice = product.purchasePrice || 0;
	rowTemplate.find(".product-price").text(product.purchasePrice.formatMoney(2));
	rowTemplate.find("input.product-quantity").val(product.quantity);
	rowTemplate.find("input.product-quantity").on("change",function(event) {
		var row = rc.context(this).closest(".product-entry-row");
		if (that.isValidPurchaseQuantity(row) == false) {
			rc.ui.showMessagePopup(rc.ui.ERROR,'Purchase limit for '+product.name+' reached. Cannot buy more than '+product.purchaseLimit+' units.');
		}
		rc.context(that.component).trigger('recalculate-sum');
	});
	rowTemplate.find("input.product-discount-code").on("change",function(event) {//RCSBIRD-15502
		var row = rc.context(this).closest(".product-entry-row");
		that.calculateProductDiscountCode(row);
	});
	rowTemplate.find("button.remove-product").click(function(event) {
		//enable option in select list
		var hrLine = $(this).closest(".product-entry-row").next(".separator-line");
		hrLine.remove();
		var productRow = rc.context(this).closest(".product-entry-row");
		//empty slot as it wont be required anymore
		var slot = productRow.attr("data-product-slot");
		rc.emptyProductSlot(slot);
		productRow.remove();
		rc.context(that.component).trigger('recalculate-sum');
		that.refreshEmptyCartMessage();
		return false;
	});
	var productEntryRow = rowTemplate.filter(".product-entry-row")[0];
	rc.context.data(productEntryRow,'product',product);
	rowTemplate.find(".product-quantity").spinner({
		spin: function(event, ui) {
			if (ui.value < 0) {
				rc.context( this ).spinner("value", 0);
				return false;
			}
		},
		change: function(event, ui) {
			rc.context(this).trigger('change');
		}
	});
	//select the create giving flag
	rowTemplate.attr("create-giving-product",product.creatGivingProduct);
	//initialize toggle and cascade value
	rowTemplate.find('.rc-toggle-primary').on('click', rc.ui.togglePrimary);
	rowTemplate.find('.rc-cascade-value').on('click', rc.ui.cascadeValue);
	rowTemplate.attr("product-description-hidden", product.hideProductDescription);
	rowTemplate.find('.rc-toggle-description').on('click', rc.ui.toggleDescription);
	rowTemplate.attr("discount-code-hidden",product.hideDiscountCode);
	rowTemplate.find('.rc-toggle-discount-code').on('click',rc.ui.toggleDisountCode);
	component.find(".panel-body").append(rowTemplate);
	rc.context(that.component).trigger('recalculate-sum');
	return false;
};

//populate data to be saved to server
rc.components.Cart.populateSetupSaveData = function(component,data) {
	var selectedProducts = [];
	var givingPostfix = '_Giving';
	rc.context(component).find(".product-entry-row").each(function(index,productRow) {
		var productRow = rc.context(productRow);
		var product = {};
		product.id = productRow.attr("data-product-id");
		if (!product.id) {return true;}
		product.def_quantity = productRow.find("input.product-quantity").val();
		product.productSlot = productRow.attr("data-product-slot");
		product.creatGivingProduct = productRow.attr("data-create-giving-product");
		product.hideProductDescription = productRow.attr("product-description-hidden");
		product.hideDiscountCode = productRow.attr("discount-code-hidden");
		selectedProducts.push(product);
	});
	data['selectedProducts'] = JSON.stringify(selectedProducts);
	return data;
};

rc.components.Cart.populateUpsertData = function(send) {
	if (!send) {return;}
	var productElemList = rc.context(".rc-component .rc-component-cart-content .product-entry-row");
	rc.context(productElemList).each(function(index,productElem) {
		var product = rc.context.data(productElem,'product');
		productElem = rc.context(productElem);
		var productSlot = productElem.attr("data-product-slot");
		if (!productSlot) {return true;}
		var fieldNamePrefix = rc.prodMap[productSlot];
		var productId = productElem.attr("data-product-id");
		if (!productId) {return true;}
		var productType = productElem.attr("data-product-type");
		//if create giving flag is true, postfix type with _Giving
		var isCreateGiving = productElem.attr("data-create-giving-product");
		if (isCreateGiving=="true") {productType+='_Giving';}
		var productQuantity = productElem.find("input.product-quantity").val();
		var productDiscountCode = rc.context(productElem).find(".product-discount-code");
		var productDiscountedAmount = rc.context(productDiscountCode).data('discountedAmount');
		var productPurchasePrice = product.purchasePrice || 0;
		productPurchasePrice = parseFloat(productPurchasePrice);
		send[productSlot] = productId;
		send[fieldNamePrefix+'_quantity__c'] = productQuantity;
		send[fieldNamePrefix+'_type__c'] = productType;
		if (productDiscountedAmount != 0) {
			send[fieldNamePrefix+'_discounted_amount__c'] = (productPurchasePrice - productDiscountedAmount);
		} else {
			send[fieldNamePrefix+'_discounted_amount__c'] = '';
		}
		send[fieldNamePrefix+'_discount_code__c'] = productDiscountCode.val();
	});

	//also populate the amount as the payment processing may happen in another context/page
	var cartPaymentDetails = rc.components.Cart.getPaymentDetails();
	if (cartPaymentDetails && cartPaymentDetails['finalAmount'] && cartPaymentDetails['finalAmount'] != '') {
		send[rc.ns+'event_purchase_giving_amount__c'] =cartPaymentDetails['finalAmount'];
	}
	return send;
};

//load product data from batch-upload object
rc.components.Cart.renderUpsertData = function(send) {
	var productSlotList = rc.getKeys(rc.prodMap);
	for (var index=0;index<productSlotList.length;++index) {
		var productSlot = productSlotList[index];
		var prefix = rc.prodMap[productSlot];
		var productId = send[productSlot];
		//if type to be managed by cart
		if (!!productId	&& send[prefix+'_type__c']!='Session' && send[prefix+'_type__c']!='Product'	&& send[prefix+'_type__c']!='Attribute') {
			//find product row
			var productElem = rc.context(".rc-component .rc-component-cart-content .product-entry-row[data-product-id='"+productId+"']");
			if (!productElem || productElem.length==0) {continue;}
			var product = rc.context.data(productElem[0],'product');
			var quantity = send[prefix+'_quantity__c'] || 0;
			quantity = parseInt(quantity,10);
			var discountCode = send[prefix+'_discount_code__c'];
			productElem.find(".product-discount-code").val(discountCode);
			var discountedAmount = send[prefix+'_discounted_amount__c'] || 0.0;
			var purchasePrice = product.purchasePrice || 0;
			var discountedAmountPerProduct = 0.0;
			if (discountedAmount != 0) {
				discountedAmountPerProduct = (purchasePrice - discountedAmount) || 0.0;
			}
			var discountCodeElement = productElem.find(".product-discount-code");
			rc.context(discountCodeElement).data('discountedAmount',discountedAmountPerProduct);

			//trigger change so total re-calculation takes place
			productElem.find("input.default-quantity").val(quantity).trigger("change");

			//if create giving is true toggle to create giving button
			if (send[prefix+'_type__c'].indexOf("_Giving") > -1) {
				productElem.find('[data-cascade="create-giving-product"][data-value="true"]').click();
			}
		} else {
			continue;
		}
	}
};

rc.components.Cart.calculateProductDiscountCode = function(row, send, deferred) {
	if (!row || row.length==0) {return;}
	var product = rc.context.data(row[0],'product');
	var productRow = rc.context(row);
	deferred = deferred || new jQuery.Deferred();
	var productId = productRow.attr("data-product-id");
	var quantity = productRow.find(".product-quantity").val();
	send = send || {};
	send.__product = productId;
	send.__discountCode = productRow.find(".product-discount-code").val();
	send.__purchasePrice = product.purchasePrice || 0;
	//if discount code is blank
	if (send.__discountCode == null || send.__discountCode == '') {
		var discountCode = rc.context(productRow).find(".product-discount-code");
		var discountedAmount = 0.0;
		rc.context(discountCode).data('discountedAmount',discountedAmount);
		rc.context(productRow).trigger('recalculate-sum');
		return;
	}
	//check if quantity is greater than 0
	if (quantity == 0) {
		rc.ui.showMessagePopup(rc.ui.ERROR, rc.zeroQuantityError);
		productRow.find(".product-discount-code").val('');
		return;
	}
	rc.ui.showMessagePopup(rc.ui.INFO, 'Applying discount code...');
	send.__action = rc.actions.selectDiscountCodeList;
	this.row = productRow;
	// Done and fail
	rc.components.remoting.send(deferred, send, rc.context.proxy(rc.components.Cart.calculateProductDiscountCode.done,this) , rc.components.Cart.calculateProductDiscountCode.fail);
	// Done
	return deferred.promise();
};

rc.components.Cart.calculateProductDiscountCode.done = function(deferred, send, recv, meta) {
	var discountCodeResponse = recv['__error'];
	if (discountCodeResponse) {
		rc.ui.showMessagePopup(rc.ui.ERROR, discountCodeResponse);
		rc.context(this.row).find(".product-discount-code").val('');
	} else {
		rc.ui.showMessagePopup(rc.ui.SUCCESS, rc.validMessageDiscountCode);
	}
	var discountedAmount = recv['__discount'];
	var discountCode = rc.context(this.row).find(".product-discount-code");
	rc.context(discountCode).data('discountedAmount',discountedAmount);
	var that = this;
	rc.context(that.row).trigger('recalculate-sum');
};

rc.components.Cart.calculateProductDiscountCode.fail = function(deferred, send, recv, meta) {
	rc.console.debug('rc.components.Cart.calculateProductDiscountCode.fail');
	rc.console.debug('this', this);
	rc.console.debug('send', send);
	rc.console.debug('recv', recv);
	rc.console.debug('meta', meta);
};
/* end event javascript */

rc.components.validateCampaignAskSection = function() {
	var paymentProcessor = rc.context('.rc-component-workflow-action[data-method="send-payment"]').attr('data-value');
	var monthlyFrequency = rc.context('.rc-component-campaign-ask[data-component-type="campaign-ask"]').find('.rc-campaign-ask-frequency-list').find('.btn[data-value != "Monthly"]');
	if (paymentProcessor == 'corduro') {
		rc.context('.rc-component-campaign-ask[data-component-type="campaign-ask"]').find('.rc-campaign-ask-frequency-list').find('.btn[data-value != "One Payment"]').addClass('disabled');
		rc.context('.rc-component-campaign-ask[data-component-type="campaign-ask"]').find('.rc-campaign-ask-frequency-list').find('.btn[data-value = "One Payment"]').trigger('click');
		if (monthlyFrequency.size() != 0) {rc.context('.rc-component-campaign-ask[data-component-type="campaign-ask"]').find(".note[data-giving-frequency='Monthly']").hide();}
	} else {
		rc.context('.rc-component-campaign-ask[data-component-type="campaign-ask"]').find('.rc-campaign-ask-frequency-list').find('.btn[data-value != "One Payment"]').removeClass('disabled');
		if (monthlyFrequency.size() != 0) {rc.context('.rc-component-campaign-ask[data-component-type="campaign-ask"]').find(".note[data-giving-frequency='Monthly']").show();}
	}
};

rc.components.CreditCard = function(container, data) {
	this.container = container;
	this.type = 'CreditCard';
	this.data = data;
	this.component = rc.components.insert('#rc-component-credit-card', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.attr('data-payment-processor', data['payment-processor']);
	this.component.attr('data-auth-only', data['auth-only']);
	this.component.attr('data-test-only', data['test-only']);
	this.component.attr('data-merchant-id', data['merchant-id']);
	this.component.attr('data-advanced-fraud-detection', data['advanced-fraud-detection']);
	this.component.attr('data-advanced-fraud-detection-test-mode', data['advanced-fraud-detection-test-mode']);
	// Attach listener to reformat CC
	this.component.find('[data-name="'+rc.ns+'payment_method_card_number__c"]').on('keyup', rc.components.CreditCard.format);
	//prepopulate values for hidden fields saved along with the form
	this.component.find('[data-field-hidden="true"]').each(function(index,hiddenField) {
		var formControlInput = rc.context(hiddenField).find(".form-control");
		//if field has a default value populate the same
		var defaultValue = rc.context(hiddenField).attr("data-default-value");
		if (defaultValue && defaultValue!='') {formControlInput.val(defaultValue);}
		var fieldName = formControlInput.attr("name");
		if (!fieldName || fieldName=='') {return true;}
		var fieldValue = data[fieldName];
		if (!fieldValue || fieldValue=='') {return true;}
		if (formControlInput.attr("type") == "text") {
			formControlInput.val(fieldValue);
		} else if (formControlInput.attr("type") == "checkbox") {
			var value = fieldValue=="true" ? true : false;
			formControlInput.prop("checked",value);
		}
	});
};

rc.components.CreditCard.format = function() {
	var oldData = rc.context(this).val();
	var data = rc.context(this).val();
	data = data.replace(/[^\d]+/g, '');
	data = data.substring(0, 16);
	data = data.match(/.{1,4}/g);
	data = data ? data.join(' ') : '';
	if (oldData==data) {return;}
	rc.context(this).val(data);// Save data back to input
	rc.validateInput.validateField(rc.ns+'payment_method_card_number__c');//revalidate the field
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
		rc.reenable(actionButtonContext);
	}
}

rc.components.Jumbotron = function(container, data) {
	this.container = container;
	this.type = 'Jumbotron';
	this.data = data;
	this.component = rc.components.insert('#rc-component-jumbotron', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('.rc-header').text(data.header);
	this.component.find('.rc-text').text(data.text);
};

rc.components.SimpleHeader = function(container, data) {
	this.container = container;
	this.type = 'SimpleHeader';
	this.data = data;
	this.component = rc.components.insert('#rc-component-simple-header', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('.rc-component-content .rc-value').html(data.text);
};

rc.components.CopyParameterAction = function(container,data) {};
rc.components.CopyParameterAction.refreshMergeFieldPicklist = function(container) {
	var copyParamAction = rc.context(container).find('[data-template="#rc-component-workflow-action--copy-param"]');
	var listItemsArray = []; //find all merge fields on the page
	$("#rc-page-container .rc-component-merge-field-content").each(function(index,mergeField) {
		var mergeFieldName  = $(mergeField).find(".rc-field-name").attr("name") || '';
		if (!mergeFieldName) {return true;}
		var mergeFieldLabel = $(mergeField).find("label.control-label").text() || mergeFieldName;
		var listItem = rc.context('<li><a class="rc-cursor-pointer rc-cascade-dropdown-text rc-cascade-value" data-value=""></a></li>');
		listItem.find('.rc-cascade-value').attr('data-value', mergeFieldName);
		listItem.find('.rc-cascade-value').text(mergeFieldLabel);
		listItemsArray.push(listItem);
	});
	copyParamAction.find('[data-dropdown-menu="target-fields"]').html('').append(listItemsArray);
	copyParamAction.find('.rc-cascade-value').on('click', rc.ui.cascadeValue);
	copyParamAction.find('.rc-cascade-dropdown-text').on('click', rc.ui.cascadeDropdownText);
};

rc.components.Image = function(container, data) {
	this.container = container;
	this.type = 'Image';
	this.data = data;
	this.component = rc.components.insert('#rc-component-image', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('img').attr('src', data['data']);
};

rc.components.URLLink = function(container, data) {
	this.container = container;
	this.type = 'URLLink';
	this.data = data;
	this.component = rc.components.insert('#rc-component-url-link', this.container, this.data);
	this.component.find(".rc-url-label .form-control").val(data['label']);
	this.component.find(".rc-url-link .form-control").val(data['link']);
	this.component.find("input.form-control").on("blur", function(event) {
		var componentElem = rc.context(this).closest(".rc-component");
		var labelValue = componentElem.find(".rc-url-label .form-control").val() || 'Untitled Link';
		var linkValue = componentElem.find(".rc-url-link .form-control").val();
		//if error 1. show error, 2. dont allow save
		linkValue = rc.context.trim(linkValue);
		//check if url starts with protocol or //
		if (linkValue) {
			var startWithProtoRegex = new RegExp("^((https?|ftp)://)|//", "i");
			if (!startWithProtoRegex.test(linkValue)) {linkValue = '//'+linkValue;}
		}
		var isValidBool = rc.components.URLLink.isValidURL(linkValue);
		var messageText = 'Invalid URL.';
		rc.context(this).closest('.form-group.rc-url-link').toggleClass("has-error",!isValidBool);
		if (!isValidBool) {
			rc.ui.addMessageToComponent(componentElem,messageText,rc.ui.ERROR);
		} else {
			rc.ui.getComponentMessages(componentElem,messageText).remove();
			linkValue = linkValue || 'javascript:void(0)';
			var widthNumber = rc.context(window).width();
			var heightNumber = rc.context(window).height();
			var onclickText ="window.open('"+linkValue+"', 'newwindow', 'menubar=1, resizable=1, width="+widthNumber+", height="+heightNumber+"'); return false;";
			componentElem.find('.rc-component-url-link-view-content a.rc-url-link-anchor').text(labelValue).attr("href",linkValue).attr("onclick",onclickText);
		}
	});
	this.component.find(".form-control").trigger('blur');//trigger now to populate data
};

rc.components.URLLink.isValidURL = function(urlText) {
	if (!urlText) {return false;}
	var regex = new RegExp("^((https?:)|(ftp:))?//(-\.)?([^\s/?\.#-]+\.?)+(/[^\s]*)?", "i");
	return regex.test(urlText);
}

rc.components.SimpleText = function(container, data) {
	this.container = container;
	this.type = 'SimpleText';
	this.data = data;
	this.component = rc.components.insert('#rc-component-simple-text', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('.rc-component-content .rc-value').html(data.text);
};

rc.components.InternalJavascript = function(container, data) {
	this.container = container;
	this.type = 'InternalJavascript';
	this.data = data || {};
	this.component = rc.components.insert('#rc-component-internal-javascript', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('.rc-component-content .form-control').val(rc.html_decode(this.data.text));
	// Update the script element in the future
	var self = this.component.find('.rc-component-content script');
	setTimeout(function() {
		self.html('$(document).ready(function() { ' + rc.html_decode((data || {}).text) + ' });');
	}, 10);
};

rc.components.ExternalJavascript = function(container, data) {
	this.container = container;
	this.type = 'ExternalJavascript';
	this.data = data;
	this.component = rc.components.insert('#rc-component-external-javascript', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('.rc-component-content .form-control').val(data.text);
	this.component.find('.rc-component-content script').attr('src', data.text);
};

rc.components.ExternalStylesheet = function(container, data) {
	this.container = container;
	this.type = 'ExternalStylesheet';
	this.data = data;
	this.component = rc.components.insert('#rc-component-external-stylesheet', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('.rc-component-content .form-control').val(data.text);
	this.component.find('.rc-component-content link').attr('href', data.text);
};

rc.components.HtmlBlock = function(container, data) {
	var that = this;
	this.container = container;
	this.type = 'HtmlBlock';
	this.data = data;
	this.component = rc.components.insert('#rc-component-html-block', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	var htmlContainer = this.component.find('.rc-component-content .rc-value');
	var viewContainer = this.component.find('.rc-component-html-view-content .rc-value');
	rc.context.data(htmlContainer[0],"html-content",data.text);
	var styleAttrText = htmlContainer.attr("style");
	viewContainer.html(data.text).attr("style",styleAttrText);
	rc.components.HtmlBlock.initializeHTMLEditor(this.component,data.text);
};

rc.components.HtmlBlock.initializeHTMLEditor = function(component, dataText) {
	var htmlContainer = component.find('.rc-component-content .rc-value');
	var htmlViewContainer = component.find('.rc-component-html-view-content .rc-value');
	var editor = CodeMirror(function(elt) {component.find(".rc-component-html-editor").append(elt);},
		{lineNumbers:true,
			value:dataText,
			mode:{name:"htmlmixed"},
			indentUnit:4,
			lineWrapping:true,
			foldGutter:true,
			gutters:["CodeMirror-linenumbers","CodeMirror-foldgutter"],
			extraKeys:{"Ctrl-Space":"autocomplete",
			"F11":function(cm) {
				cm.setOption("fullScreen", !cm.getOption("fullScreen"));
			},
			"Esc": function(cm) {
				if (cm.getOption("fullScreen")) {cm.setOption("fullScreen", false);}
		}
	}});

	editor.on("change",function(editor, changeObj) {
		rc.context.data(htmlContainer[0],"html-content",editor.getValue());
		htmlViewContainer.html(editor.getValue());
	});

	if (rc.getCurrentMode() == 'edit') {
		component.find(".rc-component-html-editor:first").show();
	} else {
		component.find(".rc-component-html-editor:first").hide();
	}
};

//refresh view when changed from editable to noneditable and vice a versa
rc.components.HtmlBlock.refreshView = function(event, editable) {
	var htmlBlockCompnents = rc.context('#rc-container-list').find('.rc-component-html-block');
	if (!htmlBlockCompnents.length) {return;}
	rc.context(htmlBlockCompnents).each(function(index,component) {
		component = rc.context(component);
		var dataText = rc.context.data(component.find(".rc-component-html-content .rc-value")[0],"html-content");
		dataText = rc.stripTags(dataText,"script");
		component.find('.rc-component-html-view-content .rc-value').html(dataText);
		if (rc.getCurrentMode() == 'edit') {
			component.find(".rc-component-html-editor:first").show();
		} else {
			component.find(".rc-component-html-editor:first").hide();
		}
	});
};

rc.components.AdvancedCSS = function(container, data) {
	this.container = container;
	this.type = 'AdvancedCSS';
	this.data = data;
	this.component = rc.components.insert('#rc-component-advanced-css', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	this.component.find('style').html(data.text);
	this.component.find('textarea').val(data.text);
	var that = this;
	this.component.find('textarea').on('keyup', function(event) {
		that.component.find('style').html(rc.context(this).val());
	});
};

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

rc.components.Session = function(container, data) {
	this.container = container;
	this.type = 'session';
	this.data = data;
	this.component = rc.components.insert('#rc-component-session', this.container, this.data);
	this.headers = this.component.find('.rc-component-headers');
	this.content = this.component.find('.rc-component-content');
	//static view component data
	var selectDataArray = [{id:'title',text:'Title'}, {id:'description',text:'Description'},
		{id:'from-date',text:'From Date'}, {id:'to-date',text:'To Date'}];
	rc.initializeViewSelector(this,selectDataArray,['title','description','from-date','to-date']);
	data.header = data.header || "Event Session";
	this.component.find('.session-header-text').text(data.header);
	// Actions: Required as properties here so that they can access the "this" value
	this.send = rc.components.Session.send;
	this.done = rc.components.Session.done;
	this.appendSessionRow = rc.components.Session.appendSessionRow;
	this.idProductMap = {};
	this.component.find('.input-group').attr('data-required', data.required);
};

rc.components.Session.validate = function() {
	var messageTypeElement = rc.context("#rc-container-list .rc-component-session .message-header");
	var isRequired = rc.context("#rc-container-list .rc-component-session-content").find('.input-group').attr('data-required');
	var isRegistered = false;
	//if no session component added to the page then skip the validation
	if (rc.context("#rc-container-list .rc-component-session-content").length == 0) {return true;}
	rc.context("#rc-container-list .rc-component-session-content .register-link").each(function(index, obj) {
		if (rc.context(obj).hasClass('selected-session') == true) {isRegistered = true;}
	});
	var present = isRegistered == false ? false : true;
	var messageText = "Please register for atleast one session and resubmit.";
	var componentElem = rc.context("#rc-container-list .rc-component-session-content");
	if (isRequired == "true" && isRegistered == false) {
		rc.context('#rc-container-list .rc-component-session-content .register-link').closest('.form-group').toggleClass('has-error', present == false);
		messageTypeElement.text(rc.ui.MessageHeaders[rc.ui.ERROR] + ' ');
		componentElem.find(".session-validation-error").show();
		rc.ui.showMessagePopup(rc.ui.ERROR,messageText);
		return present;
	} else {
		rc.context('#rc-container-list .rc-component-session-content .register-link').closest('.form-group').toggleClass('has-error', false);
		messageTypeElement.text('');
		var exist=rc.context(componentElem).find(".component-alert .message-text:contains("+messageText+")");
		if (exist.length) {exist.closest(".component-alert ").remove();}
		return true;
	}
};

rc.components.Session.send = function(deferred, send) {
	deferred = deferred || new jQuery.Deferred();
	send = send || {};
	send.__action = rc.actions.selectProductList;
	rc.components.remoting.send(deferred, send, rc.context.proxy(this.done,this),this.fail);
	return deferred.promise();
};

rc.components.Session.done = function(deferred, send, recv, meta) {
	//empty out all existing slots on the sessions
	this.component.find("[data-session-slot]").each(function(index,row) {
		rc.emptyProductSlot( rc.context(row).attr("data-session-slot") );
	});
	var campaignEvent = recv;
	for (var index=0;index<campaignEvent.sessionList.length;++index) {
		var session = campaignEvent.sessionList[index];
		//search for the campaignId
		////1. Read the json, query for the session id, get the productSlot
		//// At the time of creation of the form, there will be no json
		//// and no selectedSessions json tag will exist, at that point the if
		//// condition will stop getting into the loop, after the json is created
		//// selectedSessions will be populated with values.
		var selectedSessionArr;
		var savedSessionText = this.data["selectedSessions"];
		if (!!savedSessionText) {
			selectedSessionArr = JSON.parse(savedSessionText);
			for (var idx=0;idx<selectedSessionArr.length;idx++) {
				var sessionSavedData = selectedSessionArr[idx];
				if (!sessionSavedData) {continue;}
				//2. attach productSlot to the session
				if (session.campaignId == sessionSavedData.id) {
					session.productSlot = sessionSavedData.productSlot;
					session.id = sessionSavedData.id;
					break;
				}
			}
		}
		//3. call appendSessionRow
		this.appendSessionRow(session);
	}
	rc.context(this.component).find(".register-link").click(function(event) {
		var isSelected = !rc.context(this).hasClass("selected-session");
		rc.components.Session.toggleRegisterButton(isSelected,this);
		return false;
	});
	rc.initializeViewSelector.rerender(this);
};

rc.components.Session.toggleRegisterButton =function(value, button) {
	if (value==true) {
		rc.context(button).removeClass("btn-primary").addClass("btn-success").addClass("selected-session").find('.register-link-text').text("Registered");
		rc.context(button).find(".glyphicon-remove").show();
	} else {
		rc.context(button).removeClass("btn-success").addClass("btn-primary").removeClass("selected-session").find('.register-link-text').text("Register");
		rc.context(button).find(".glyphicon-remove").hide();
	}
}

rc.components.Session.isSessionAlreadyAdded = function(session) {
	var sessionElem = rc.context(".rc-component .rc-component-session-content .session-entry-row[data-session-id='"+session.Id+"']");
	if (sessionElem.length>0) {return sessionElem;}
	return null;
};

rc.components.Session.appendSessionRow = function(session) {
	if (!session) {return;}
	var that = this;
	var component = rc.context(this.component);
	var rowTemplate = rc.context(rc.context("#rc-component-session-row-template").html());
	//session-batch start
	var foundRow = rc.components.Session.isSessionAlreadyAdded(session);
	if (foundRow!=null) {
		rc.ui.showMessagePopup(rc.ui.INFO,'Session already added to form');
		return;
	}
	var productSlotId = null;
	if (session.productSlot && session.productSlot!='') {
		rc.emptyProductSlot(session.productSlot);
		productSlotId = session.productSlot;
	} else {
		productSlotId = rc.getProductSlot();
	}
	if (!productSlotId) {
		rc.ui.showMessagePopup(rc.ui.ERROR,'Maximum allowed products added !');
		return;
	}
	rowTemplate.attr("data-session-type",'session');
	rowTemplate.attr("data-session-id",session.campaignId);
	rowTemplate.attr("data-session-slot",productSlotId);
	rowTemplate.find(".session-name").text(session.name);
	rowTemplate.find(".session-description").text(session.description);
	var startDate = moment(session.StartDateTime).format('MM/DD/YYYY h:mm a');
	var endDate = moment(session.EndDateTime).format('MM/DD/YYYY h:mm a');
	rowTemplate.find(".session-startDate").text(startDate);
	rowTemplate.find(".session-endDate").text(endDate);
	var sessionEntryRow = rowTemplate.filter(".session-entry-row")[0];
	rc.context.data(sessionEntryRow,'session',session);
	component.find(".session-panel-body").append(rowTemplate);
	return false;
};

//populate data to be saved to server
rc.components.Session.populateSetupSaveData = function(component,data) {
	var selectedSessions = [];
	var selectedValuesArr = rc.context(component).find(".view-component-select").val();
	if (selectedValuesArr && selectedValuesArr.length>0) {
		var selectedViewComponents = selectedValuesArr.join(",");
		data['selectedViewComponents'] = selectedViewComponents;
	}
	rc.context(component).find(".session-entry-row").each(function(index,sessionRow) {
		var sessionRow = rc.context(sessionRow);
		var session = {};
		session.id = sessionRow.attr("data-session-id");
		if (!session.id) {
			return true;
		}
		session.productSlot = sessionRow.attr("data-session-slot");
		selectedSessions.push(session);
	});
	data['selectedSessions'] = JSON.stringify(selectedSessions);
	return data;
};

rc.components.Session.populateUpsertData = function(send) {
	if (!send) {return;}
	var rowTemplate = rc.context(rc.context("#rc-component-session-row-template").html());
	var sessionElemList = rc.context(".rc-component .rc-component-session-content .session-entry-row");
	rc.context(sessionElemList).each(function(index,sessionElem) {
		sessionElem = rc.context(sessionElem);
		var sessionSlot = sessionElem.attr("data-session-slot");
		var fieldNamePrefix = rc.productSlotPrefixMap[sessionSlot];
		var sessionId = sessionElem.attr("data-session-id");
		var sessionType = sessionElem.attr("data-session-type");
		if (sessionElem.find(".register-link").hasClass("selected-session")) {
			send[sessionSlot] = sessionId;
			send[fieldNamePrefix+'_type__c'] = sessionType;
			send[fieldNamePrefix+'_quantity__c'] = 1;
		} else if (sessionElem.attr("data-register-flag") == '1') {
			var sessionId = sessionElem.attr("data-session-id");
			var sessionType = sessionElem.attr("data-session-type");
			send[sessionSlot] = sessionId;
			send[fieldNamePrefix+'_type__c'] = sessionType;
			send[fieldNamePrefix+'_quantity__c'] = -1;
		}
	});
	return send;
};

rc.components.Session.renderUpsertData = function(send) {
	var productSlotList = rc.getKeys(rc.productSlotPrefixMap);
	for (var index=0;index<productSlotList.length;++index) {
		var productSlot = productSlotList[index];
		var prefix = rc.productSlotPrefixMap[productSlot];
		var sessionId = send[productSlot];
		//if type to be managed by session component.
		if (!!sessionId && send[prefix+'_type__c']=='Session') {
			var sessionElem = rc.context(".rc-component .rc-component-session-content .session-entry-row[data-session-id='"+sessionId+"']");
			if (!sessionElem || sessionElem.length==0) {continue;}
			if (sessionElem.attr("data-session-slot")!=productSlot) {
				sessionElem.attr("data-session-slot",productSlot);
				rc.emptyProductSlot(sessionElem.attr("data-session-slot"));
			}
			var regButton = sessionElem.find(".register-link");
			var registerFlag = send[prefix+'_quantity__c'];
			registerFlag = parseInt(registerFlag);
			sessionElem.attr('data-register-flag',registerFlag);
			if (registerFlag==1) {
				rc.components.Session.toggleRegisterButton(true,regButton);
			}
		}
	}
};


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

rc.isNumericOrNull = function(str) {
	return (!str || /^[-+]?[0-9]*\.?[0-9]+$/.test(str));
}

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

// This is used to determine which workflows are still executing. When this is empty, we reactivate the disabled button.
rc.workflow.executingMap = {};
/* This is to allow the SendPayment 'fail' workflow to be called separately during the SaveData workflow, since the existing
form design is to configure SendPayment and SaveData as separate actions.
When the form processing is 'Transactional', the payment auth accept/decline won't be known until the SaveData action
completes. The intent is that rc.workflow.retroactiveFailure will *only* have 'fail' actions and may be reject()ed when SaveData
results in a payment decline.  When SaveData completes successfully, the expectation is that processing will continue
only with the "success" action on the SaveData action (per the TAOS-774 design assumptions).
This is a workaround to provide backwards-compatibility with the current form design model.

This alternate flow will always be overwritten before each currently-executing workflow, and the reference must be copied
by the executing action in order to be saved for later. */
rc.workflow.retroactiveFailure = null;

/* This is to allow configured workflow actions to "quench" the done() and fail() actions on their parent workflow.
The quench is used when a payment is processed transactionally and the server request completes successfully, but the payment
is declined. In that circumstance, the payment handling will quench the normal onFailure actions of the SendData workflow,
and instead run the onFailure action(s) of the separately-configured SendPayment workflow, which is copied from
rc.workflow.retroactiveFailure during the SendPayment workflow action.
This is a workaround to provide backwards-compatibility with the current form design model, in which SendPayment and SendData are separate. */
rc.workflow.quenchByGuid = {};

rc.workflow.hasPaymentProcessor = function() {
	return rc.context('#rc-workflows-list .rc-component-workflow-action[data-method="send-payment"]').length > 0;
};

rc.workflow.forceFail = function(deferred, quenchGuid, msg) {
	rc.workflow.quenchByGuid[quenchGuid] = true;
	rc.console.log(msg);
	deferred.reject(msg);
}

rc.workflow.execute = function(guid,actionButtonContext) {
	//if workflow trigger in the context of an action button,
	//always disable the actionButton which was source of the event
	if (actionButtonContext) {actionButtonContext.prop("disabled",true);}
	rc.console.debug('rc.workflow.execute', guid);
	var context = rc.context('#' + guid);
	var flow_origin = new jQuery.Deferred(); // null deferred to kickoff the flow
	var flow = flow_origin.promise();
	rc.workflow.retroactiveFailure = new jQuery.Deferred();
	var retroactiveFailureFlow = rc.workflow.retroactiveFailure.promise();
	rc.workflow.executingMap[guid] = true;
	// Add actions
	context.find('[data-component-type="workflow-action"]').each(function() {
		var action = rc.context(this);
		var action_type = action.attr('data-context');
		var action_guid = action.attr('id');
		var action_method = action.attr('data-method');
		rc.console.debug('.. adding action', action_guid, action_type, action.attr('data-method'));
		if (action_type == 'then' || action_type == 'execute') { // the "execute" type is for very early versions of the form
			
			flow = flow.then(function(data) {
				return rc.workflow.process('then', action_guid, {workflowGuid:guid}, actionButtonContext);
			});
		}
		if (action_type == 'done') {
			flow.done(function(data) {
				if (!rc.workflow.quenchByGuid[guid]) {
					return rc.workflow.process('done', action_guid, {workflowGuid:guid}, actionButtonContext);
				}
			});
		}
		if (action_type == 'fail') {
			flow.fail(function(data) {
				if (!rc.workflow.quenchByGuid[guid]) {
					return rc.workflow.process('fail', action_guid, {workflowGuid:guid}, actionButtonContext);
				}
			});
			// Retroactive failure flows are always called explicitly, so we ignore the quench
			retroactiveFailureFlow.fail(function(data) {
				return rc.workflow.process('fail', action_guid, {workflowGuid:guid}, actionButtonContext);
			});
		}
	});
	flow.always(function() {
		//after all workflows are complete, reenable the button
		rc.workflow.executingMap[guid] = false;
		if (actionButtonContext) {
			var workflowsRunning = false;
			for (var key in rc.workflow.executingMap) {
				workflowsRunning = workflowsRunning || rc.workflow.executingMap[key];
			}
			if (!workflowsRunning) {rc.reenable(actionButtonContext);}
		}
		rc.workflow.quenchByGuid[guid] = null;
	});
	// Resolve placeholder promise
	flow_origin.resolve();
};

rc.workflow.process = function(type, guid, data, actionButtonContext) {
	//always disable action button when executing any action
	if (actionButtonContext) {actionButtonContext.prop("disabled",true);}
	rc.console.debug('rc.workflow.process');
	rc.console.debug('.. guid', guid);
	rc.console.debug('.. type', type);
	rc.console.debug('.. data', data);
	// Find and execute
	var deferred = new jQuery.Deferred();
	deferred.workflowGuid = data.workflowGuid;
	var action = rc.context('#' + guid);
	var method_map = {};
	method_map['copy-param'] = rc.workflow.process.CopyParameter;
	method_map['javascript'] = rc.workflow.process.Javascript;
	method_map['load-data'] = rc.workflow.process.LoadData;
	method_map['load-href'] = rc.workflow.process.LoadHref;
	method_map['load-page'] = rc.workflow.process.LoadPage;
	//method_map['send-address'] = rc.workflow.process.SendAddress;
	//method_map['send-chatter'] = rc.workflow.process.SendChatter;
	method_map['send-data'] = rc.workflow.process.SendData;
	method_map['send-mail'] = rc.workflow.process.SendMail;
	method_map['send-payment'] = rc.workflow.process.SendPayment;
	//method_map['send-text'] = rc.workflow.process.SendText;
	//method_map['send-twitter'] = rc.workflow.process.SendTwitter;
	//method_map['show-alert'] = rc.workflow.process.ShowAlert;
	method_map['traffic-controller'] = rc.workflow.process.TrafficController;
	method_map['workflow'] = rc.workflow.process.Workflow;
	// Execute method
	var method_action = action.attr('data-method');
	var method = method_map[method_action] || function(deferred, action) {};
	try {
		var method_result = new method(deferred, action, data, actionButtonContext);
	} catch (action_excp) {
		rc.console.debug('!!! exception', action_excp);
		deferred.reject();
	}
	return deferred.promise();
};

rc.workflow.process.CopyParameter = function(deferred, action, data) {
	var parameter = rc.context(action).attr('data-parameter');
	var toField = rc.context(action).attr('data-value');
	// Copy parameter data
	rc.context('.form-control[name="' + toField + '"]').val(rc.getParam(parameter) || '');
	deferred.resolve();
};

rc.workflow.process.Javascript = function(deferred, action, data) {
	deferred = deferred || new jQuery.Deferred();
	action = action || rc.context();
	var action_data = action.find('.rc-fg[data-method="javascript"] .form-control').val();
	var action_function = eval('(function(deferred, data) { ' + action_data + ' })');
	var action_eval = action_function.call(action, deferred, data);
	if (action_eval == false) {
		deferred.reject();
	} else {
		deferred.resolve();
	}
};

rc.workflow.process.LoadData = function(deferred, action, data) {
	rc.selectData(deferred, null);
};

rc.workflow.process.LoadPage = function(deferred, action, data) {
	var campaignFormId = rc.paramFormCampaignId;
	console.log('campaignFormId = ' + campaignFormId);
	if (campaignFormId == '') {campaignFormId=rc.campaignId;}
	console.log('campaignFormId after blank check = ' + campaignFormId);
	var redirectTo = rc.pageCampaignDesignForm + '?id=' + rc.campaignId
		+ '&formCampaignId=' + campaignFormId + '&form=' + action.attr('data-value')
		+ '&data=' + rc.getParam('data');
	window.location = redirectTo;
};

rc.workflow.process.TrafficController = function(deferred, action, data) {
	var campaignFormId = rc.paramFormCampaignId;
	console.log('campaignFormId = ' + campaignFormId);
	if (campaignFormId == '') {campaignFormId=rc.campaignId;}
	console.log('campaignFormId after blank check = ' + campaignFormId);
	var redirectTo = rc.pageCampaignTrafficControllerRoute + '?id=' + rc.campaignId
		+ '&formCampaignId=' + campaignFormId + '&form=' + rc.getParam('form')
		+ '&data=' + rc.getParam('data');
	window.location = redirectTo;
};

rc.workflow.process.LoadHref = function(deferred, action, data) {
	var href = rc.context(action).attr('data-value');
	if (href == null || href == '') {return;}
	if (href.match('(http:|https:)?(/?)/.+')) {
		window.location = href;
	} else {
		window.location = '//' + href;
	}
	return false;
};

rc.workflow.process.SendData = function(deferred, action, data) {
	rc.upsertData(deferred, data);
};

rc.workflow.process.SendMail = function(deferred, action, data) {
	deferred = deferred || new jQuery.Deferred();
	action = action || rc.context();
	var mailSendTo = action.attr("data-mail-to") || '';
	var mailReplyTo = action.attr("data-mail-reply-to") || '';
	var mailSubject = action.attr("data-mail-subject") || '';
	var mailBody = action.attr("data-mail-body") || '';
	var sendToArray = rc.workflow.process.SendMail.getFilteredMailArray(mailSendTo);
	var replyToArray = rc.workflow.process.SendMail.getFilteredMailArray(mailReplyTo);
	if (!sendToArray || !sendToArray.length) {deferred.reject();}
	var email = {};
	email.__action = rc.actions.sendMail;
	email.toList = sendToArray.join();
	email.replyTo = replyToArray.length ? replyToArray[0] : '';
	email.subject = mailSubject;
	email.body = mailBody;
	this.done = rc.workflow.process.SendMail.done;
	rc.components.remoting.send(deferred, email, this.done, this.fail);
	var data = {};
};

rc.workflow.process.SendMail.done = function(deferred, send, recv, meta) {};
rc.workflow.process.SendMail.getFilteredMailArray = function(emails) {
	var resultArray = [];
	var emailsArray = emails.split(",");
	//replace merge fields with actual values.
	for (var index=0; index < emailsArray.length; index++) {
		var emailText = rc.context.trim(emailsArray[index]);
		if (emailText && rc.workflow.process.SendMail.isValidMergeField(emailText)) {
			//find the merge field value
			var fieldName = rc.ui.MergeFieldMap[emailText].field || '';
			var mailText = rc.context('input[name="'+fieldName+'"]:first').val() || '';
			var controlField = rc.ui.MergeFieldMap[emailText].control || '';
			var controlValue = controlField ? rc.context('input[name="'+controlField+'"]:first').is(':checked') : false;
			//if control is set then dont send email : opt out option
			if (controlValue == true) {continue;}
			if (mailText) {resultArray.push(mailText);}
		} else if (emailText && rc.workflow.process.SendMail.isValidEmail(emailText)) {
			resultArray.push(emailText);
		}
	}
	return resultArray;
}

rc.workflow.process.SendMail.isValidEmail = function(emailText) {
	return emailText.match(/.+@.+\..+/i)!==null;
}

rc.workflow.process.SendMail.isValidMergeField = function(mergeFieldText) {
	if (!mergeFieldText) {return false;}
	var regex = new RegExp("^(<Contact Mail [1|2]>)$");
	return regex.test(mergeFieldText);
}

rc.workflow.process.SendPayment = function(deferred, action, data) {
	// Validate fields in the payment processor?
	// Do not validate the fields for discount codes
	rc.context('.form-control').filter(':visible:NOT(input.product-discount-code)').change();
	if (rc.context('.form-group.has-error').length != 0) {return;}
	var cartPaymentDetails = rc.components.Cart.getPaymentDetails() || {finalAmount:0};
	var askPaymentDetails = rc.components.CampaignAsk.getAskValue() || {finalAmount:0};
	//if nothing to process, pass the processing
	if (cartPaymentDetails.finalAmount == 0 && askPaymentDetails.finalAmount == 0) {
		//if no data found then skip payment processing but create payment method
		rc.workflow.integrations.populateDefaultFields(action, data);
		//and resolve the workflow action so that payment process action is green
		return deferred.resolve();
	}
	action.paymentDetails = rc.components.CampaignAsk.getAskValue();
	if (action.paymentDetails) {
		action.paymentDetails = action.paymentDetails || {};
		action.paymentDetails.isGiving = true;
		action.paymentDetails.givingAmount = action.paymentDetails.finalAmount || 0.0;
	} else {
		action.paymentDetails = action.paymentDetails || { };
		action.paymentDetails.isGiving = action.paymentDetails.isGiving || false;
	}

	//Events
	//clone the object, so that it wont update giving action object and let giving call back to update it
	var eventsAction = jQuery.extend(true, {}, action);
	//get rcEvent related payment data
	eventsAction.paymentDetails = rc.components.Cart.getPaymentDetails();
	if (eventsAction.paymentDetails) {
		eventsAction.paymentDetails = eventsAction.paymentDetails || {};
		action.paymentDetails.isEvent = true;
		action.paymentDetails.eventAmount = eventsAction.paymentDetails.finalAmount || 0.0;
	} else {
		action.paymentDetails.isEvent = action.paymentDetails.isEvent || false;
	}
	var givingAmountIsValid = rc.isNumericOrNull(action.paymentDetails.givingAmount);
	var eventAmountIsValid = rc.isNumericOrNull(action.paymentDetails.eventAmount);
	if (!givingAmountIsValid || !eventAmountIsValid) {
		return deferred.reject('Invalid amount format: '+action.paymentDetails.givingAmount+' | '+action.paymentDetails.eventAmount);
	}
	rc.ui.showProcessingModal();
	action.paymentDetails.eventGivingAmount = ((parseFloat(action.paymentDetails.givingAmount) || 0.0) + (parseFloat(action.paymentDetails.eventAmount) || 0.0)) || 0.0;
	if (rc.isPaymentTransactional) {
		// In transactional mode, we must send the card data to the server; so, this must be disabled.
		// Turning this off at this point presumes that the workflow will continue to upsertData, where these
		// fields will be included in the request. This is a design assumption of TAOS-774.
		rc.enableLocalOnly(false);
		// Populate some payment-related data on the BU fields to be submitted
		if (action.paymentDetails.isGiving == true) {
			rc.context('input[name="'+rc.ns+'giving_giving_frequency__c"]').val(action.paymentDetails.frequency);
			rc.context('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
		}
		if (action.paymentDetails.isEvent == true) {
			rc.context('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
		}
		// Store params for processing the pending payment within the next SendData RemoteAction
		rc.pendingPayment = {};
		// This section is intended for processor-specific params that will be copied over verbatim to the unified request.
		// At this time, these are only required for Litle
		// 'isAdvancedFraudDetection' indicates whether the admin enabled AFD during form design; it's not only the merchant setting.
		rc.pendingPayment.processorParams = {};
		rc.pendingPayment.processorParams['isAdvancedFraudDetection'] = rc.context(action).attr("data-advanced-fraud-detection");
		rc.pendingPayment.processorParams['sessionId'] = rc.sessionId;
		// Copy the payment alternate flow related to the current SendPayment action. This will be used during a future SaveData workflow.
		// An alternative attempted was to clone the failure flow from the deferred passed to this method; however, that deferred refers only to the
		// SendPayment action, and not the larger workflow on which the onFailure actions are defined. Consequently, we refer here to a failure
		// flow that was copied when the current workflow was initially parsed.
		rc.pendingPayment.deferred = rc.workflow.retroactiveFailure;
		return deferred.resolve();
	} else {
		// Non-transactional / client-side handling: send payment request immediately
		var paymentDeferred = new jQuery.Deferred();
		paymentDeferred.done(function() {
			deferred.resolve();
		}).fail(function() {
			rc.ui.releaseProcessingModal();
			deferred.reject();
		});
		return rc.workflow.process.SendPayment.send(paymentDeferred, action, data);
	}
};

rc.workflow.process.SendPayment.send = function(deferred, action, data) {
	if (action.attr('data-value') == 'corduro') {
		if (rc.context('#corduro_snap #maskcorduro_snap').length == 0) {rc.workflow.integrations.Corduro(deferred, action);}
		return rc.workflow.integrations.Corduro.send(deferred, action);
	}
	if (action.attr('data-value') == 'iATS') {
		return rc.workflow.integrations.IATS(deferred, action);
	}
	if (action.attr('data-value') == 'Cybersource') {
		return rc.workflow.integrations.Cybersource(deferred, action);
	}
	if (action.attr('data-value') == 'PayPal') {
		return rc.workflow.integrations.PayPal(deferred, action);
	}
	if (action.attr('data-value') == 'Litle') {
		return rc.workflow.integrations.Litle(deferred, action);
	}
	if (action.attr('data-value') == 'sage') {
		return rc.workflow.integrations.Sage(deferred, action);
	}
	if (action.attr('data-value') == 'Authorize.net') {
		return rc.workflow.integrations.AuthDotNet(deferred, action);
	}
	if (action.attr('data-value') == 'heartland') {
		return rc.workflow.integrations.Sage(deferred, action);
	}
	return deferred.reject('No payment processor found!');
}

rc.workflow.process.Workflow = function(deferred, action, data, actionButtonContext) {
	rc.workflow.execute(rc.context(action).attr('data-value'),actionButtonContext);
	deferred.resolve();
};


rc.upsertData = function(deferred, send) {
	rc.console.debug('rc.upsertData');
	rc.console.debug('.. this', this);
	rc.console.debug('.. send', send);
	send = send || {};
	send.__action = rc.actions.upsertData;
	send.__data = rc.getParam('data');
	deferred = deferred || new jQuery.Deferred();
	// Find all of the component form controls
	rc.context('.rc-component-content .form-control[name]').each(function() {
		var context = rc.context(this);
		var name = context.attr('name');
		// Add to send map
		if (context.attr('type') === 'checkbox') {
			if (context.is(':checked')) {
				send[name] = 'true';
			} else {
				send[name] = 'false';
			}
		} else {
			send[name] = context.val();
		}
		//TAOS-10, Hierarchy of importance, user input, default,
		//if the default is blank default it with Donation, else populate as default value.
		if ((name == rc.ns+'giving_record_type__c') && (context.attr('type') === 'text' && context.val() == '' && context.attr('data-field-default') == '')) {
			send[name] = 'Donation';
		}
		// Run validation
		context.change();
	});
	if (rc.upsertData.validateCustomComponents() == false) {return deferred.reject(send);}
	if (rc.getCurrentMode() != 'view') {/* Must be in view mode */
		return deferred.reject('Internal error: form must be in view mode to process user input.');
	}
	//populate events shopping cart data
	send = rc.components.Cart.populateUpsertData(send);
	//populate events session data
	send = rc.components.Session.populateUpsertData(send);
	send = rc.components.Attribute.populateUpsertData(send);
	//for ask data
	var askAmount = rc.components.CampaignAsk.getAskValue();
	if (askAmount && askAmount.frequency) {
		send[rc.ns+'giving_giving_frequency__c'] = askAmount.frequency;
		send[rc.ns+'giving_giving_amount__c'] = askAmount.finalAmount;
		if (askAmount.frequency != rc.givingFreqOnePymt) {
			send[rc.ns+'giving_is_sustainer__c'] = 'true';
		} else {
			send[rc.ns+'giving_is_sustainer__c'] = 'false';
		}
	}
	var doneCallback = rc.upsertData.done;
	// TAOS-774 Transactional payment processing
	if (rc.isPaymentTransactional && rc.pendingPayment) {
		send.__action = rc.actions.processPaymentAndForm;
		doneCallback = function(deferred, send, recv, meta) {
			if (rc.pendingPayment) {
				try {
					// Clear pending payment after each attempt:
					var pp = rc.pendingPayment;
					rc.pendingPayment = null;
					rc.ui.releaseProcessingModal();
					recv = recv || {};
					if (recv.__data) {rc.setParam('data', recv.__data);}
					var isFlagged = jQuery.isEmptyObject(recv) || 'Flagged' == recv[rc.ns+'batch_upload_status__c'];
					if (recv.isSuccess != 'true') {
						// Represents a payment decline
						var declineMsg = 'Denied: ' + recv.responseMessage + '  ' + recv.responseCode;
						/* pp.deferred is expected to be populated here, and is the normal "declined" flow.
						If it is not present, it's an error and we fall thru to the exception catch below.
						Since we are using the SendPayment fail() actions to handle payment declines,
						we quench the done() and fail() actions on the SendData workflow. */
						rc.workflow.forceFail(pp.deferred, deferred.workflowGuid, declineMsg);
					} else if (isFlagged) {
						/* Represents a save data or other server error AFTER the payment has been processed.
						We clear the Batch Upload Public Token to avoid overwriting the completed payment data on subsequent attempts */
						rc.clearPublicToken(send, recv);
						// This will force the "Save Data" failure flow rather than the "Process Payment" failure flow
						rc.workflow.forceFail(rc.workflow.retroactiveFailure, deferred.workflowGuid, recv[rc.ns+'batch_upload_flagged_reason__c']);
					}
				} catch (message) {
					// We clear the Batch Upload Public Token to avoid overwriting the possibly completed payment data on subsequent attempts
					if (recv.isSuccess == 'true') {rc.clearPublicToken(send, recv);}
					rc.workflow.forceFail(rc.workflow.retroactiveFailure, deferred.workflowGuid, message);
					/* Note: I tried to use the below for "forceFail" functionality but wasn't able to in the current workflow design
					See: http://stackoverflow.com/questions/17800176/jquery-deferred-rejecting-a-promise-from-within-a-done-filter */
				}
			} else {
				return rc.upsertData.done(deferred, send, recv, meta);
			}
		}
	}

	/* TAOS-1490 - If 2 save data workflows existed in the form, then the "Exclude Giving"
	and "Exclude Events" flag of the first w/f defined in the metadata would override any other
	save data workflows. The old solution is commented out and the new solution is implemented. */
	var context = rc.context('#' + deferred.workflowGuid);
	context.find('[data-component-type="workflow-action"]').each(function() {
		var action = rc.context(this);
		var action_type = action.attr('data-context');
		var action_guid = action.attr('id');
		var action_method = action.attr('data-method');
		var exclude_giving_flag = action.attr('exclude-giving');
		var exclude_events_flag = action.attr('exclude-events');
		if (action_type == "then" && action_method == "send-data") {
			if (exclude_giving_flag==null || exclude_giving_flag===undefined) {
				exclude_giving_flag = "true";
			}
			send[rc.ns+'exclude_giving__c'] = exclude_giving_flag;
			if (exclude_events_flag==null || exclude_events_flag===undefined || exclude_events_flag=="true") {
				exclude_events_flag = "false";
			} else if (exclude_events_flag=="false") {
				exclude_events_flag = "true";
			}
			send[rc.ns+'process_events__c'] = exclude_events_flag;
		}
	});
	// Form failures?
	if (rc.context('.form-group.has-error').length != 0) {return deferred.reject(send);}
	//case cleanup, convert all keys to lower case
	send = rc.cleanKeysToLower(send);
	// TAOS-774 Transactional payment processing
	if (rc.isPaymentTransactional && rc.pendingPayment) {
		// Copy processor-specific params into the request
		// This is done after cleanKeysToLower because legacy payment processors expect case-sensitive keys
		for (name in rc.pendingPayment.processorParams) {
			send[name] = rc.pendingPayment.processorParams[name];
		}
	}
	rc.dataModal.BatchUploadModel = $.extend(rc.dataModal.BatchUploadModel, send);
	rc.components.remoting.send(deferred, send, doneCallback, rc.upsertData.fail);
	return deferred.promise();
};

//Validating Ask, Cart, Session component on submission of form
rc.upsertData.validateCustomComponents = function() {
	if (rc.components.CampaignAsk.validateAskValue() == false) {return false;}
	if (rc.components.Cart.validate() == false) {return false;}
	if (rc.components.Session.validate() == false) {return false;}
	return true;
};

//WARNING : Avoid adding validation code here - see Campaign_Design_Form_Validator.component
rc.upsertData.validate = function() {
	rc.console.debug('rc.upsertData.validate');
	rc.console.debug('.. this', this);
	var context = rc.context(this);
	var present = context.val() ? true: false;
	var errorLabel = rc.context(rc.context("#rc-error-label").html());
	if ($(this).attr('type') === 'checkbox') {
		$(context).is(':checked') ? 'true' : 'false';
		return true;
	}
	//if validated by bootstrap validator and has error then ignore
	if (context.hasClass("validate-field") && context.closest(".form-group").hasClass("has-error")) {
		return false;
	}
	//remove error labels if any
	context.closest(".input-group").prev(".rc-error-label").remove();
	context.closest(".input-group").removeClass("has-error");
	//Validate other amount
	if (context.attr("data-validate-type")=="otherAmount" && present) {
		var minimumThresholdAmount = rc.components.CampaignAsk.frequencyAmountMinThreshold[context.parent().attr('data-giving-frequency')];
		// Trim the leading and trailing spaces and replace the textbox value with it
		var otherAmountValue = rc.context.trim(context.val());
		context.val(otherAmountValue);
		// validation for TAOS-1509 - todo: move to Campaign_Design_Form_Validator - will be complicated
		if (!otherAmountValue.match(/^\d+\.?\d{0,2}$/)) {
			errorLabel.find(".label-text").text('The Amount must be a number with only 2 decimal places');
			context.closest(".input-group").before(errorLabel);
			context.closest(".input-group").addClass("has-error");
		} else if (minimumThresholdAmount != undefined && parseFloat(otherAmountValue) < parseFloat(minimumThresholdAmount)) {
			errorLabel.find(".label-text").text('The amount which you entered should be greater than the minimum threshold amount: $' + minimumThresholdAmount);
			context.closest(".input-group").before(errorLabel);
			context.closest(".input-group").addClass("has-error");
		}
	}
	//validate comma separated email fields
	if (context.attr("data-validate-type")=="csv-email" && present) {
		var emailListText = context.val() || "";
		var emailListArray = emailListText.split(",");
		var invalidEmailsArray = [];
		for (var index=0;index<emailListArray.length;++index) {
			console.log('index,',index);
			console.log('emailListArray[index],',emailListArray[index]);
			var emailText = rc.context.trim(emailListArray[index]);
			if (emailText==null || !emailText) {
				continue;
			}
			if (rc.workflow.process.SendMail.isValidMergeField(emailText)) {
				continue;
			}
			if (!rc.workflow.process.SendMail.isValidEmail(emailText)) {
				invalidEmailsArray.push(emailText);
			}
		}
		if (invalidEmailsArray.length>0) {
			var labelText = 'Invalid Email(s): '+invalidEmailsArray.join(",");
			errorLabel.find(".label-text").text(labelText);
			context.closest(".input-group").before(errorLabel);
			context.closest(".input-group").addClass("has-error");
			console.log('context.closest(".input-group")',context.closest(".input-group"));
		}
	}
	var monthContext = context.closest(".rc-component-credit-card").find('[name="'+rc.ns+'payment_method_card_expiration_month__c"]');
	var yearContext = context.closest(".rc-component-credit-card").find('[name="'+rc.ns+'payment_method_card_expiration_year__c"]');
	if (context.attr("name")==rc.ns+"payment_method_card_expiration_month__c") {
		var month = parseInt(monthContext.val(),10);
		if (month==0) {
			context.closest(".input-group").addClass("has-error");
			errorLabel.find(".label-text").text("Invalid month - please update and resubmit.");
			context.closest(".input-group").before(errorLabel);
			rc.ui.showMessagePopup(rc.ui.ERROR,"Invalid month - please update and resubmit.");
		}
	}
};

rc.upsertData.done = function(deferred, send, recv, meta) {
	// Update the batch upload ID param
	rc.setParam('data', recv.__data);
	// reset any pending payment
	rc.pendingPayment = null;
	rc.ui.releaseProcessingModal();
};

rc.upsertData.fail = function(deferred, send, recv, meta) {
	// reset any pending payment
	rc.pendingPayment = null;
	rc.ui.releaseProcessingModal();
};


//Form validation framework start
rc.validateInput = function() { };

rc.validateInput.populateUpsertFormData = function(component) {
	var validateInfo = {};
	var validatorDisableFlags = {};
	if (!component) {
		return validateInfo;
	}
	component = rc.context(component);
	var fieldName;
	var validators;
	component.find('.rc-component-content .form-control[name],.rc-component-content .form-control[data-name]').each(function(index,field) {
		field = rc.context(field);
		fieldName = field.attr("name") || field.attr("data-name") || "";
		validators = field.attr("data-validate-type") || "";
		if (!fieldName) {
			return true;
		}
		if (field.hasClass("validate-field")) {
			validateInfo[fieldName] = validators;
		}
		//check if all validations for this field are disabled ? 
		if (rc.context(field).closest("[data-validatation-disabled]").attr("data-validatation-disabled") == "true") {
			validatorDisableFlags[fieldName] = true;
		} else {
			validatorDisableFlags[fieldName] = false;
		}
	});
	return { "validatorInfo":validateInfo, "validatorDisableFlags":validatorDisableFlags };
};

rc.validateInput.initializeComponentData = function(component,data) {
	if (!data.validatorDisableFlags || !data.validatorInfo) {
		return;
	}
	var keyList = rc.getKeys(data.validatorDisableFlags);
	var fieldName;
	var field;
	var isDisabled;
	for (var index = 0; index < keyList.length; ++index) {
		fieldName = keyList[index];
		if (data.validatorInfo) {
			validators = data.validatorInfo[fieldName];
		} else {
			validators = "";
		}
		if (data.validatorDisableFlags) {
			isDisabled = data.validatorDisableFlags[fieldName] == true ? "true" : "false";
		} else {
			isDisabled = "false";
		}
		field = rc.context(component).find('.form-control[name="'+fieldName+'"],.form-control[data-name="'+fieldName+'"]');
		if (isDisabled == "true") {
			rc.context(field).closest("[data-validatation-disabled]").attr("data-validatation-disabled", isDisabled);
			rc.context(field).closest("[data-validatation-disabled]").find('[data-cascade="data-validatation-disabled"]').trigger('click');
		} else {
			rc.context(field).closest("[data-validatation-disabled]").attr("data-validatation-disabled", "false");
		}
		rc.context(field).attr("data-validate-type", validators);
	}
};

//disable the local only feature, to allow validations to be fired on fields
rc.enableLocalOnly = function(enableLocalOnly) {
	var localFieldList = rc.context('#rc-page-container [data-local-only="true"] input.rc-field-name[data-name]');
	localFieldList.each(function(index,field) {
		if (false == enableLocalOnly) {
			field = rc.context(field);
			field.attr("name",field.attr("data-name"));
		} else if (true == enableLocalOnly) {
			field = rc.context(field);
			field.removeAttr("name");
		}
	});
};

//temporary disable the local only feature, to allow validations to be fired on such fields
rc.validateInput.initialize = function() {
	rc.enableLocalOnly(false);
	//add default validator classes to each field configured for validation, add validator to form once
	rc.context('#rc-page-container').bootstrapValidator({
		framework: 'bootstrap',
		feedbackIcons: {
			valid: 'glyphicon glyphicon-ok',
			invalid: 'glyphicon glyphicon-remove',
			validating: 'glyphicon glyphicon-refresh'
		}
	});
	rc.context('#rc-page-container .rc-component-content .form-control[name]').each(function(index,field) {
		field = rc.context(field);
		rc.validateInput.initializeFieldValidator(field);
	});
};

rc.validateInput.isFieldValidatorsDisabled = function(field) {
	return field.closest("[data-validatation-disabled]").attr("data-validatation-disabled") == "true";
};

rc.validateInput.isFieldRequired = function(field) {
	return field.closest("[data-required]").attr("data-required") == "true";
};

//accepts form-control input dom component/element
rc.validateInput.initializeFieldValidator = function(component) {
	var fieldName;
	var validatorTypesArray;
	var validateTypeAttr;
	var validatorRuleSet;
	var validatorRule;
	var component = rc.context(component);
	var fieldName = component.attr("name");
	if (!fieldName) {
		return true;
	}
	//check if validate flag already set (via json data load) if field validator is not disabled
	if (component.hasClass("validate-field")) {
		validateTypeAttr = component.attr('data-validate-type');
		//instead of array store to json genarate validation rule accordingly
		//currently only supporting standard validations stored as attributes
		//which are populated via json
		if (validateTypeAttr) {
			validatorTypesArray = validateTypeAttr.split(";");
		}
	} else if (rc.validateInput.fieldValidator[fieldName]
		&& rc.validateInput.fieldValidator[fieldName].length > 0) {
		//check if there is a default validate entry
		validatorTypesArray = rc.validateInput.fieldValidator[fieldName];
		validateTypeAttr = validatorTypesArray.join(";");
		component.attr('data-validate-type',validateTypeAttr);
		component.addClass("validate-field");
	}

	//if system/custom validators are disabled
	if (rc.validationsEnabled != "true" || !validatorTypesArray
		|| rc.validateInput.isFieldValidatorsDisabled(component) == true) {
		validatorTypesArray = [];
	}
	var nonEmptyValidatorIndex = rc.context.inArray("notEmpty",validatorTypesArray);
	//check if the component is required
	if (rc.validateInput.isFieldRequired(component) == true) {
		if (nonEmptyValidatorIndex == -1) {
			validatorTypesArray.push("notEmpty");
		}
	} else if (nonEmptyValidatorIndex != -1) {
		//array still has the nonEmpty or required rule, but the field is no longer required
		//remove the same from array
		validatorTypesArray.splice( validatorTypesArray, 1);
	}
	return rc.validateInput.initializeFieldValidatorRules(fieldName,validatorTypesArray);
};

rc.validateInput.initializeFieldValidatorRules = function(fieldName, validatorTypesArray) {
	if (!validatorTypesArray || !validatorTypesArray.length) {
		return false;
	}
	var validatorRule;
	var validatorRuleSet = {};
	for (var index = 0; index< validatorTypesArray.length; ++index) {
		validatorRule = validatorTypesArray[index];//if standard
		if (!validatorRule) {
			continue;
		}
		//add code for custom validators
		validatorRule = rc.validateInput.getValidator(validatorRule);
		//merge all validation rules together into validatorRuleSet
		validatorRuleSet = rc.context.extend( validatorRuleSet, validatorRule );
	}
	validatorRuleSet = {"validators":validatorRuleSet};
	//try removing the field first to clear all existing validators if any
	try {
		rc.context('#rc-page-container').bootstrapValidator('removeField',fieldName);
	} catch (exception){ }
	rc.context('#rc-page-container').bootstrapValidator('addField',fieldName,validatorRuleSet);
	return true;
};

rc.validateInput.getValidator = function(validatorType) {
	return rc.validateInput.validatorMap[validatorType];
};

rc.validateInput.isFormValid = function() {
	var container = rc.context('#rc-page-container');
	var form = container.data('bootstrapValidator');
	form.validate();
	return form.isValidContainer(container);
};

//manually validate the field 
rc.validateInput.validateField = function(field) {
	if (!field) {
		return;
	}
	rc.context("#rc-page-container").bootstrapValidator('revalidateField',field);
};

rc.validatorsRequiringCountry = ["zipCode","iban","phone"];

//use default validator for these fields
//rc.validateInput.fieldWiseDefaultValidators = {}; // todo: remove - old name
rc.validateInput.fieldValidator = {};
rc.validateInput.fieldValidator[rc.ns+'address_country__c'] = ["countryCode"];
rc.validateInput.fieldValidator[rc.ns+'address_country_name__c'] = ["country"];
rc.validateInput.fieldValidator[rc.ns+'address_postal_code__c'] = ["zipCode"];
rc.validateInput.fieldValidator[rc.ns+'address_state__c'] = ["state"];
rc.validateInput.fieldValidator[rc.ns+'address_zip__c'] = ["zipCode"];
rc.validateInput.fieldValidator[rc.ns+'address_2_city__c'] = ["city"];
rc.validateInput.fieldValidator[rc.ns+'address_2_country__c'] = ["countryCode"];
rc.validateInput.fieldValidator[rc.ns+'address_2_country_name__c'] = ["country"];
rc.validateInput.fieldValidator[rc.ns+'address_2_postal_code__c'] = ["zipCode"];
rc.validateInput.fieldValidator[rc.ns+'address_2_state__c'] = ["state"];
rc.validateInput.fieldValidator[rc.ns+'address_2_zip__c'] = ["zipCode"];
rc.validateInput.fieldValidator[rc.ns+'address_city__c'] = ["city"];
rc.validateInput.fieldValidator[rc.ns+'contact_1_email__c'] = ["email"];
rc.validateInput.fieldValidator[rc.ns+'contact_2_email__c'] = ["email"];
rc.validateInput.fieldValidator[rc.ns+'contact_1_phone_1__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'contact_1_phone_2__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'contact_2_phone_1__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'contact_2_phone_2__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'event_purchase_giving_amount__c'] = ["amount"];
rc.validateInput.fieldValidator[rc.ns+'giving_check_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'giving_close_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'giving_close_date_time__c'] = ["datetime"];
rc.validateInput.fieldValidator[rc.ns+'giving_giving_amount__c'] = ["amount"];
rc.validateInput.fieldValidator[rc.ns+'giving_giving_years__c'] = ["year"];
rc.validateInput.fieldValidator[rc.ns+'giving_record_amount__c'] = ["amount"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_billing_email__c'] = ["email"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_billing_phone__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_card_expiration_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_card_expiration_month__c'] = ["monthExpiration"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_card_expiration_year__c'] = ["yearExpiration"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_card_last_four_digits__c'] = ["numeric"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_card_number__c'] = ["creditCard"];
rc.validateInput.fieldValidator[rc.ns+'payment_method_card_security_code__c'] = ["cvv"];
rc.validateInput.fieldValidator[rc.ns+'preferences_1_end_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'preferences_1_start_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'preferences_2_end_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'preferences_2_start_date__c'] = ["date"];
rc.validateInput.fieldValidator[rc.ns+'recipient_city__c'] = ["city"];
rc.validateInput.fieldValidator[rc.ns+'recipient_country__c'] = ["country"];
rc.validateInput.fieldValidator[rc.ns+'recipient_email__c'] = ["email"];
rc.validateInput.fieldValidator[rc.ns+'recipient_phone__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'recipient_postal_code__c'] = ["zipCode"];
rc.validateInput.fieldValidator[rc.ns+'recipient_preferred_email__c'] = ["email"];
rc.validateInput.fieldValidator[rc.ns+'recipient_preferred_phone__c'] = ["phone"];
rc.validateInput.fieldValidator[rc.ns+'recipient_state_province__c'] = ["state"];

/* keep for reference until tested
rc.validateInput.fieldWiseDefaultValidators = {
	"{!nameSpaceLowerCase}contact_1_email__c":["email"],
	"{!nameSpaceLowerCase}payment_method_card_number__c":["creditCard"],
	"{!nameSpaceLowerCase}address_2_city__c":["city"],
	"{!nameSpaceLowerCase}address_2_country__c":["countryCode"],
	"{!nameSpaceLowerCase}address_2_city__c":["city"],
	"{!nameSpaceLowerCase}address_2_country__c":["countryCode"],
	"{!nameSpaceLowerCase}address_2_country_name__c":["country"],
	"{!nameSpaceLowerCase}address_2_postal_code__c":["zipCode"],
	"{!nameSpaceLowerCase}address_2_state__c":["state"],
	"{!nameSpaceLowerCase}address_2_zip__c":["zipCode"],
	"{!nameSpaceLowerCase}address_city__c":["city"],
	"{!nameSpaceLowerCase}address_country__c":["countryCode"],
	"{!nameSpaceLowerCase}address_country_name__c":["country"],
	"{!nameSpaceLowerCase}address_postal_code__c":["zipCode"],
	"{!nameSpaceLowerCase}address_state__c":["state"],
	"{!nameSpaceLowerCase}address_zip__c":["zipCode"],
	"{!nameSpaceLowerCase}contact_1_phone_1__c":["phone"],
	"{!nameSpaceLowerCase}contact_1_phone_2__c":["phone"],
	"{!nameSpaceLowerCase}contact_2_email__c":["email"],
	"{!nameSpaceLowerCase}contact_2_phone_1__c":["phone"],
	"{!nameSpaceLowerCase}contact_2_phone_2__c":["phone"],
	"{!nameSpaceLowerCase}event_purchase_giving_amount__c":["amount"],
	"{!nameSpaceLowerCase}giving_check_date__c":["date"],
	"{!nameSpaceLowerCase}giving_close_date__c":["date"],
	"{!nameSpaceLowerCase}giving_close_date_time__c":["datetime"],
	"{!nameSpaceLowerCase}giving_giving_amount__c":["amount"],
	"{!nameSpaceLowerCase}giving_giving_years__c":["year"],
	"{!nameSpaceLowerCase}giving_record_amount__c":["amount"],
	"{!nameSpaceLowerCase}payment_method_billing_email__c":["email"],
	"{!nameSpaceLowerCase}payment_method_billing_phone__c":["phone"],
	"{!nameSpaceLowerCase}payment_method_card_expiration_date__c":["date"],
	"{!nameSpaceLowerCase}payment_method_card_expiration_month__c":["monthExpiration"],
	"{!nameSpaceLowerCase}payment_method_card_expiration_year__c":["yearExpiration"],
	"{!nameSpaceLowerCase}payment_method_card_last_four_digits__c":["numeric"],
	"{!nameSpaceLowerCase}payment_method_card_security_code__c":["cvv"],
	"{!nameSpaceLowerCase}preferences_1_end_date__c":["date"],
	"{!nameSpaceLowerCase}preferences_1_start_date__c":["date"],
	"{!nameSpaceLowerCase}preferences_2_end_date__c":["date"],
	"{!nameSpaceLowerCase}preferences_2_start_date__c":["date"],
	"{!nameSpaceLowerCase}recipient_city__c":["city"],
	"{!nameSpaceLowerCase}recipient_country__c":["country"],
	"{!nameSpaceLowerCase}recipient_email__c":["email"],
	"{!nameSpaceLowerCase}recipient_phone__c":["phone"],
	"{!nameSpaceLowerCase}recipient_postal_code__c":["zipCode"],
	"{!nameSpaceLowerCase}recipient_preferred_email__c":["email"],
	"{!nameSpaceLowerCase}recipient_preferred_phone__c":["phone"],
	"{!nameSpaceLowerCase}recipient_state_province__c":["state"]
}
*/
//standard validators
rc.validateInput.validatorMap = {
	"notEmpty" : {
		notEmptyRC: {
			message: 'This field is required'
		}
	},
	"email" : {
		regexp: {
			regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
			message: 'Please enter a valid email address' 
		} 
	},
	"phone" : {
		phone_US_RC: {
			message: 'The value is not valid US phone number',
			transformer: function($field, validatorName, validator) {
				var value = $field.val();
				value = value.replace(/\D/g, '');
				// Check if the value has format of XXX XXX XXXX
				if (/^(\d){3}(\s+)(\d){3}(\s+)(\d){4}$/.test(value)) {
					return value.replace(/\s/g, '');// Remove all spaces
				}
				// Otherwise, return the original value
				return value;
			}
		}
	},
	"city" : {
		regexp: {
			regexp: /^([a-zA-Z\u0080-\u024F]+(?:. |-| |'|,))*[a-zA-Z\u0080-\u024F]*([a-zA-Z]{1}\.[a-zA-Z]{1}\.)*$/,
			message: 'Please enter a valid City name'
		}
	},
	"country" : {
		regexp: {
			regexp: /^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$/,
			message: 'Please enter a valid Country name'
		}
	},
	"state" : {
		regexp: {
			regexp: /\b([A-Za-z]{2})\b/,
			message: 'Please enter a valid State abbreviation'
		},
		stringLength: {
			min: 2,
			max: 2,
			message: 'A valid State abbreviation can have only two characters'
		}
	},
	"countryCode" : {
		regexp: {
			regexp: /\b([A-Za-z]{2}|[A-Za-z]{3})\b/,
			message: 'Please enter a valid Country abbreviation'
		},
		stringLength: {
			min: 2,
			max: 3,
			message: 'A valid Country abbreviation can have only two or three characters'
		}
	},
	"creditCard" : {
		creditCard: {
			message: 'Please enter a valid Credit Card number',
			transformer: function($field, validatorName, validator) {
				var value = $field.val();
				// Remove all spaces
				return value.replace(/\s/g, '');
			}
		}
	},
	"zipCode" : {
		zipCode: {
			country: 'US',
			message: 'The value is not a valid zipcode'
		}
	},
	"date" :{
		date: {
			format: 'YYYY-MM-DD',
			message: 'The value is not a valid date, must in format YYYY-MM-DD'
		}
	},
	"cvv" : {
		cvv: {
			creditCardField: rc.ns+"payment_method_card_number__c",
			message: 'The CVV number is not valid'
		}
	},
	"monthExpiration" : {
		between: {
			min: 1,
			max: 12,
			inclusive: true,
			message: 'The month must be between 01 and 12'
		},
		digits: {
			message: 'The expiration month can contain digits only'
		},
		callback: {
			message: 'Expired',
			callback: function(value, validator, $field) {
				value = parseInt(value, 10);
				var year = rc.context('[name="'+rc.ns+'payment_method_card_expiration_year__c"]').val(),
					currentMonth = new Date().getMonth() + 1,
					currentYear  = new Date().getFullYear();
				if (value < 0 || value > 12) {
					return false;
				}
				if (year == '') {
					return true;
				}
				year = parseInt(year, 10);
				if (year > currentYear || (year == currentYear && value >= currentMonth)) {
					validator.updateStatus(rc.ns+'payment_method_card_expiration_year__c', 'VALID');
					return true;
				} else {
					return false;
				}
			}
		}
	},
	"yearExpiration" : {
		numeric: {
			message: 'The year must be a number'
		},
		callback: {
			message: 'Expired',
			callback: function(value, validator, $field) {
				value = parseInt(value, 10);
				var month = rc.context('[name="'+rc.ns+'payment_method_card_expiration_month__c"]').val(),
					currentMonth = new Date().getMonth() + 1,
					currentYear  = new Date().getFullYear();
				if (value < currentYear) {
					return false;
				}
				if (month == '') {
					return false;
				}
				month = parseInt(month, 10);
				if (value > currentYear || (value == currentYear && month >= currentMonth)) {
					validator.updateStatus(rc.ns+'payment_method_card_expiration_month__c', 'VALID');
					return true;
				} else {
					return false;
				}
			}
		}
	},
	"amount" : {
		/*,
		numeric: {
			message: 'The amount must be a number',
			transformer: function($field, validatorName, validator) {
				var value = $field.val();
				return value.replace(',', '');// strip out commas
			}
		},new validation below for TAOS-1509*/
		regexp: {
			regexp: /^\d+\.?\d{0,2}$/,
			message: 'The Amount must be a number with only 2 decimal places'
		}
	}
};

//Custom non empty validator for turning off the same in the edit mode
(function($) {
	$.fn.bootstrapValidator.i18n.notEmptyRC = $.extend($.fn.bootstrapValidator.i18n.notEmptyRC || {}, {
		'default': 'Please enter a value'
	});
	$.fn.bootstrapValidator.validators.notEmptyRC = {
		enableByHtml5: function($field) {
			var required = $field.attr('required') + '';
			return ('required' === required || 'true' === required);
		},
		validate: function(validator, $field, options) {
			//Always validate in the edit mode
			if ( rc.getCurrentMode() == 'edit') {
				return true;
			}
			var type = $field.attr('type');
			if ('radio' === type || 'checkbox' === type) {
				return validator.getFieldElements($field.attr('data-bv-field')).filter(':checked').length > 0;
			}
			if ('number' === type && $field.get(0).validity && $field.get(0).validity.badInput === true) {
				return true;
			}
			return $.trim($field.val()) !== '';
		}
	};
}(window.jQuery));

(function($) {
	$.fn.bootstrapValidator.i18n.phone_US_RC = $.extend($.fn.bootstrapValidator.i18n.phone_US_RC || {}, {
		'default': 'Please enter a valid phone number'
	});
	$.fn.bootstrapValidator.validators.phone_US_RC = {
		validate: function(validator, $field, options) {
		var value = $field.val();
		if (value === '') {
			return true;
		}
		value = value.replace(/\D/g, '');
		var isValid = (/^(?:(1\-?)|(\+1 ?))?\(?(\d{3})[\)\-\.]?(\d{3})[\-\.]?(\d{4})$/).test(value) && (value.length === 10 || value.length === 11);
		return isValid;
	}
};
}(window.jQuery));

rc.initializeParams();
rc.initializeFormApp();
