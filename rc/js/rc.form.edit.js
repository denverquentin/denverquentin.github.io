/* Put methods that are only used during the form design/edit here.
Feel free to put loads of comments in the code and be sure to minify
this script any time it's edited. The Campaign_DesignForm.page should
always load the minified version. */
console.log('LOADED rc.form.edit.js - MUST BE IN EDIT MODE!!!!');
rc = rc || {};
rc.ui = rc.ui || {};
rc.modal = rc.modal || {};
rc.components = rc.components || {};

rc.ui.markUnsavedChanges = function() {
	rc.context('#rc-ui-icon-unsaved-changes').show();
};

rc.ui.showProcessingModal = function() {
	rc.ui.showProcessingModal.queue.push(true);
	rc.context('#rc-modal-processing').modal('show');
}

rc.ui.releaseProcessingModal = function() {
	rc.ui.showProcessingModal.queue.pop();
	if (rc.ui.showProcessingModal.queue.length == 0) {rc.context('#rc-modal-processing').modal('hide');}
}

rc.ui.showProcessingModal.queue = [];



rc.modal.loadContainerCSS = function() {
	rc.console.debug('rc.modal.loadContainerCSS', this);
	var component = rc.context('.rc-selected').filter(':first');
	var context = rc.context(this).find('.rc-cascade-value-target');
	rc.console.debug('.. using component:', component);
	rc.console.debug('.. using context:', context);
	// Reset any current items
	context.find('[data-cascade^="css-"]').filter('.btn-primary').removeClass('btn-primary');
	context.find('[data-cascade^="css-"]').filter('input').val('');
	context.find('[data-cascade^="css-font-size"]').filter(':first').click();
	context.find('[data-cascade^="css-orientation"]').filter(':first').click();
	context.find('[data-cascade^="css-text-align"]').filter(':first').click();
	// Delete any form attributes starting with css-
	rc.context(context.get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-')) {context.removeAttr(attr.name);}
	});
	// Copy assigned CSS attributes from component to modal context
	rc.context(component.get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-') == null) {return;}
		rc.console.log('.. match', attr);
		var controls = context.find('[data-cascade^="' + attr.name + '"]');
		//controls.filter('.btn-default').click();
		//trigger change event so cascade input will cascade value to parent target-data
		controls.filter('input,textarea').val(attr.value).change();
		controls.filter('[data-value="' + attr.value + '"]').click();
	});
};

rc.modal.saveContainerCSS = function() {
	rc.console.debug('rc.modal.saveContainerCSS', this);
	var component = rc.context('.rc-selected').filter(':first');
	var context = rc.context(this).closest('.rc-cascade-value-target');
	rc.console.debug('.. using component:', component);
	rc.console.debug('.. using context:', context);
	// Delete any form attributes starting with css-
	rc.context(component.get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-')) {component.removeAttr(attr.name);}
	});
	// Copy assigned CSS attributes from modal to component context
	rc.context(context.get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-')) {component.attr(attr.name, attr.value);}
		if (attr.name.match('css-') && attr.name == 'css-display') {
			var componentContentElem = component.find('.rc-component-content');
			//skip components which are always hidden in view mode viz. custom js,css comp.
			if (true == componentContentElem.hasClass("rc-always-hidden-in-view")) {return true;}
			if (attr.value == 'hidden') {
				componentContentElem.attr("data-field-hidden", true);
			} else {
				componentContentElem.attr("data-field-hidden", false);
			}
		}
	});
	rc.components.updateContentCSS(component);// Apply CSS
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	rc.context('.rc-selected').removeClass('rc-selected');// Delete selection marker
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.loadContainerColumns = function() {
	rc.console.debug('rc.modal.loadContainerColumns', this);
	var item = rc.context('.rc-selected').filter(':first');// Working container
	// Set the right number of columns
	var form = rc.context(this);
	form.find('.modal-header .btn[data-value="' + item.attr('data-columns') + '"]').click();
	// For each column, set the right size
	item.find('.rc-container-column').each(function() {
		var item_size = rc.context(this).attr('data-size') || '12';
		var item_position = rc.context(this).attr('data-position') || '1';
		var item = form.find('.rc-cp[data-position="' + item_position + '"]');
		// Update the menu
		item.find('.rc-ui-column-width-dropdown-menu [data-value="' + item_size + '"]:first a').click();
	});
};

rc.modal.saveContainerColumns = function() {
	rc.console.debug('rc.modal.saveContainerColumns', this);
	// Find the container
	var form = rc.context(this).closest('.modal');
	// Set the right number of columns
	var item = rc.context('.rc-selected').filter(':first');
	var item_content = item.find('.rc-container-column-list-content');
	// Build the column data
	var item_data = {};
	item_data.columns = [];
	item_data.data = {};
	item_data.data.columns = parseInt(form.attr('data-columns'));
	form.find('.rc-cp').filter(':visible').each(function() {
		var data = {};
		data.components = [];
		data.data = {};
		data.data.position = parseInt(rc.context(this).attr('data-position'));
		data.data.size = parseInt(rc.context(this).attr('data-size'));
		item_data.columns.push(data);// Add to column data list
	});
	item.attr('data-columns', item_data.data.columns);// Update the column list
	// Update the column DOM
	rc.components.deleteColumnListColumns(item_content, item_data.data.columns);
	rc.components.upsertColumnListColumns(item_content, item_data.data.columns, item_data.columns);
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.loadInsertComponent = function() {
	rc.console.debug('rc.modal.loadInsertComponent', this);
	var modal = rc.context(this);
	modal.find('.rc-toggle-primary.btn-primary').removeClass('btn-primary');
	modal.find('.rc-toggle-active.active').removeClass('active');
	modal.find('.rc-component-dropdown .dropdown-toggle-text').html('&nbsp;');
	modal.find('.rc-component-overview').hide();
	modal.find('.rc-component-overview[data-component="--none--"]').show();
	modal.find('.rc-component-overview input').val('');
	modal.find('.rc-component-overview input[type="checkbox"]').removeAttr('checked');
	modal.find('.rc-component-overview input[type="radio"]').removeAttr('selected');
	modal.find('.rc-component-overview textarea').val('');
	// Set the first column position button as active+primary
	var position_btns = modal.find('button[data-cascade="data-position"]');
	position_btns.filter(':first').addClass('btn-primary');
	position_btns.filter(':first').addClass('active');
	position_btns.filter(':first').addClass('active').click();//Click the button
	position_btns.show();;
	// How many possible columns are there?
	var columns = parseInt(rc.context('.rc-selected').filter(':first').attr('data-columns') || '1');
	position_btns.each(function() {
		if (columns <= parseInt(rc.context(this).attr('data-value'))) {rc.context(this).hide();}
	});
	// If the merge field list is empty, load it now
	if (rc.context('#rc-modal-insert-component--merge-field-list').is(':empty')) {rc.selectFieldInfoList();}
};

rc.modal.saveInsertComponent = function() {
	rc.console.debug('rc.modal.saveInsertComponent', this);
	var form = rc.context(this).closest('.rc-cascade-value-target');
	var form_type = form.attr('data-component');
	var form_data = form.find('.rc-component-overview[data-component="' + form_type + '"]');
	// Look up the selected column list, then the item
	var item_position = form.attr('data-position');
	var item = rc.context('.rc-selected:first .rc-container-column[data-position="' + item_position + '"]');
	var item_content = item.find('.rc-container-column-content');
	// Add the new component
	var data = {};
	data.type = form_type;
	data.data = {};
	// Some component types have values
	if (data.type == 'button') {data.data['text'] = form_data.find('.form-control').val();}
	if (data.type == 'internal-javascript') {data.data['text'] = form_data.find('.form-control').val();}
	if (data.type == 'external-javascript') {data.data['text'] = form_data.find('.form-control').val();}
	if (data.type == 'external-stylesheet') {data.data['text'] = form_data.find('.form-control').val();}
	if (data.type == 'html-block') {
		data.data['text'] = form_data.find('.form-control').val();
		data.data['text'] = rc.stripTags( data.data['text'] , "script" );
	}
	if (data.type == 'url-link') {
		data.data['label'] = form_data.find('.form-control.rc-url-label').val();
		data.data['link'] = form_data.find('.form-control.rc-url-link').val();
	}
	if (data.type == 'image') {
		if (form_data.find('.btn-primary').attr('data-value') == 'host') {
			data.data['data'] = form_data.find('.form-control.rc-image-host').val();
		}
		if (form_data.find('.btn-primary').attr('data-value') == 'file-inline') {
			data.data['data'] = form_data.find('.form-control.rc-image-file').attr('data-image-data');
		}
	}
	if (data.type == 'jumbotron') {
		data.data['header'] = form_data.find('.form-control.rc-header').val();
		data.data['text'] = form_data.find('.form-control.rc-text').val();
	}
	if (data.type == 'merge-field') {
		data.data['default'] = form_data.find('[data-cascade="data-merge-field-default"]').val();
		data.data['hidden'] = form_data.find('[data-cascade="data-merge-field-hidden"]').val();
		data.data['name'] = form_data.find('[data-cascade="data-merge-field-api-name"]').val();
		data.data['text'] = form_data.find('[data-cascade="data-merge-field-text"]').val();
		data.data['type'] = form_data.find('[data-cascade="data-merge-field-api-type"]').val();
	}
	if (data.type == 'simple-header') {
		data.data['text'] = form_data.find('.form-control').val();
	}
	if (data.type == 'simple-text') {
		data.data['text'] = form_data.find('.form-control').val();
	}
	//rcEvents components start
	if (data.type == 'cart') {
		data.data['header'] = form_data.find('.form-control.rc-header').val();
	}
	if (data.type == 'session') {
		data.data['header'] = form_data.find('.form-control.rc-header').val();
	}
	if (data.type == 'attribute') {
		data.data['header'] = form_data.find('.form-control.rc-header').val();
	}
	rc.components.upsertComponent(item_content, data);// Save it
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.loadHelpWizard = function() {
	var form = rc.context(this);
	var step = form.find('.modal-dialog').attr('data-step') || '1';
	form.find('.modal-header .btn[data-value="' + step + '"]').click();
};

rc.modal.prevHelpWizard = function() {
	var form = rc.context(this).closest('.modal');
	form.find('.modal-header .btn-primary').prev().click();
};

rc.modal.nextHelpWizard = function() {
	var form = rc.context(this).closest('.modal');
	form.find('.modal-header .btn-primary').next().click();
};

rc.modal.confirmClone = function() {
	rc.console.debug('rc.modal.confirmClone', this);
	var component = rc.context('.rc-selected');
	var component_clone = component.clone();
	component.after(component_clone);
	rc.components.initialize(component_clone);// Re-initialize
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	rc.context('.rc-selected').removeClass('rc-selected');// Unselect for safety
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.confirmDelete = function() {
	rc.console.debug('rc.modal.confirmDelete', this);
	//when component is deleted free-up product slots it was using
	rc.updateProductSlots(rc.context('.rc-selected'));
	rc.context('.rc-selected').remove();// Apply event
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	// Deleting the last container?
	if (rc.context('#rc-container-list').is(':empty')) {rc.context('#rc-container-list-messages').slideDown();}
	rc.context('.rc-selected').removeClass('rc-selected');// Unselect for safety
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.confirmDeleteForm = function() {
	rc.context('#rc-container-list').empty();;
	rc.context('#rc-workflows-list').empty();
	rc.deleteFormData();// Delete form from SF
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.confirmRenameForm = function() {
	// Save new name to the form list
	var modal = rc.context(this).closest('.modal');
	// Rename form in SF
	rc.upsertFormData({name:modal.find('.modal-body input[type="text"]').val()});
	rc.selectFormInfoList();// Reselect form name list
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
};

rc.modal.confirmInsertForm = function() {
	var modal = rc.context(this).closest('.modal');// Save new name to the form list
	// Empty the contents
	rc.context('#rc-container-list').empty();
	rc.context('#rc-workflows-list').empty();
	// Add new form with the specified name
	rc.upsertFormData({name:modal.find('.modal-body input[type="text"]').val(),type:'insert'});
	rc.selectFormInfoList();// Reselect form name list
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
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

// todo: probably edit only
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

// todo: probably only edit
// Column List
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

// todo: probably only edit
rc.components.deleteColumnListColumns = function(container, max_position) {
	rc.context(container).find('.rc-container-column').each(function() {
		var position = parseInt(rc.context(this).attr('data-position') || '999');
		if (max_position < position) {rc.context(this).remove();};
	});
}

// todo: probably only edit
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

// todo: probably only edit
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

// todo: probably only edit
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


