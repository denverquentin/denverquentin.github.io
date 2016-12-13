/* Put methods that are only used during the form design/edit here.
Feel free to put loads of comments in the code and be sure to minify
this script any time it's edited. The Campaign_DesignForm.page should
always load the minified version. */
rc = rc || {};
rc.ui = rc.ui || {};
rc.modal = rc.modal || {};

rc.initializeFormAppInDesignMode = function() {
	console.log('rc.initializeFormAppInDesignMode');
	rc.components.initialize('.modal');// Copy data templates in modal templates
	rc.components.initialize('.page-header');// Initialize actions in the page header
	// Which page mode is set?
	rc.context('#rc-page-container').find('.page-header [data-value="' + rc.getParam('mode') + '"]').click();
	//on view change refresh html block elements to toggle between html<->text views
	rc.events.on('view-change',rc.components.HtmlBlock.refreshView);
	// on view change, toggle placeholder values shown in fields
	rc.events.on('view-change',rc.rollupPlaceholderValues);
	// on view change, toggle default values shown in fields
	rc.events.on('view-change',rc.rollupDefaultValues);
	rc.initializeModals();
	rc.initializeHeaderButtons();
};

rc.rollupPlaceholderValues = function(event, placeholderValues) {
	console.log('rc.rollupPlaceholderValues');
	var placeholderValueComponents = rc.context('[placeholder]');
	if (!placeholderValueComponents.length) {return;}
	rc.context(placeholderValueComponents).each(function(index, field) {
		field = rc.context(field);
		var placeholderData = field.attr('placeholder') || '';
		if (field.val() == false || field.val() == '') {field.val(placeholderData);}
	});
}

rc.initializeModals = function() {
	// Bind modal : confirm clone
	rc.context('#rc-modal-confirm-clone').find('[data-action="confirm"]').on('click', rc.modal.confirmClone);
	// Bind modal : confirm delete
	rc.context('#rc-modal-confirm-delete').find('[data-action="confirm"]').on('click', rc.modal.confirmDelete);
	// Bind modal : confirm delete form
	rc.context('#rc-modal-confirm-delete-form').find('[data-action="confirm"]').on('click', rc.modal.confirmDeleteForm);
	// Bind modal : confirm insert form
	rc.context('#rc-modal-confirm-insert-form').find('[data-action="confirm"]').on('click', rc.modal.confirmInsertForm);
	// Bind modal : confirm rename form
	rc.context('#rc-modal-confirm-rename-form').find('[data-action="confirm"]').on('click', rc.modal.confirmRenameForm);
	// Bind modal : configure layout
	rc.context('#rc-modal-edit-columns').on('show.bs.modal', rc.modal.loadContainerColumns);
	rc.context('#rc-modal-edit-columns').find('[data-action="save"]').on('click', rc.modal.saveContainerColumns);
	// Bind modal : configure css
	rc.context('#rc-modal-edit-css').on('show.bs.modal', rc.modal.loadContainerCSS);
	rc.context('#rc-modal-edit-css').find('[data-action="save"]').on('click', rc.modal.saveContainerCSS);
	// Bind modal : insert component
	rc.context('#rc-modal-insert-component').on('show.bs.modal', rc.modal.loadInsertComponent);
	rc.context('#rc-modal-insert-component').find('[data-action="save"]').on('click', rc.modal.saveInsertComponent);
	// Bind modal : help wizard
	rc.context('#rc-modal-help-wizard').on('show.bs.modal', rc.modal.loadHelpWizard);
	rc.context('#rc-modal-help-wizard').find('[data-action="prev"]').on('click', rc.modal.prevHelpWizard);
	rc.context('#rc-modal-help-wizard').find('[data-action="next"]').on('click', rc.modal.nextHelpWizard);
	// Bind modal : help wizard : Remove the youtube link from it stops playing
	rc.context('#rc-modal-help-wizard').find('[data-action="undo"]').on('click', function() {
		rc.context('#rc-modal-help-wizard').find('iframe[src]').attr('src', '');
	});
	// Bind modal : help wizard : Bind clicks on the buttons to load those body sections
	rc.context('#rc-modal-help-wizard').find('.modal-header .btn[data-value]').on('click', function() {
		var form = rc.context(this).closest('.modal');
		var step = rc.context(this).attr('data-value');
		var body = form.find('.modal-body[data-step="' + step + '"]');
		// Set the youtube video
		form.find('iframe').attr('src', body.attr('data-video-source'));
		// Hide the rest of the body items
		form.find('.modal-body').hide();
		body.show();
	});
};

rc.initializeHeaderButtons = function() {
	// Bind page header buttons
	rc.context('#rc-page-container').find('.page-header [data-value="view"]').on('click', rc.ui.toggleContentEditable);
	rc.context('#rc-page-container').find('.page-header [data-value="view"]').on('click', rc.setModeView);
	rc.context('#rc-page-container').find('.page-header [data-value="edit"]').on('click', rc.ui.toggleContentEditable);
	rc.context('#rc-page-container').find('.page-header [data-value="edit"]').on('click', rc.setModeEdit);
	rc.context('#rc-page-container').find('.page-header [data-value="flow"]').on('click', rc.ui.toggleContentEditable);
	rc.context('#rc-page-container').find('.page-header [data-value="flow"]').on('click', rc.setModeFlow);
	rc.context('#rc-page-container').find('.page-header [data-action="rc-action-save"]').on('click', function() {
		rc.upsertFormData();
	});
	// Add sections
	rc.context('#rc-page-container').find('.page-header [data-action="rc-action-insert-section"]').on('click', function() {
		var data = {data:{columns:rc.context(this).attr('data-value')}};
		rc.components.insertColumnList('#rc-container-list',data);
		rc.ui.markUnsavedChanges();
	});
	// Add workflow
	rc.context('#rc-page-container').find('.page-header [data-action="rc-action-insert-workflow"]').on('click', function() {
		rc.components.insertWorkflow('#rc-workflows-list',{});
		rc.ui.markUnsavedChanges();
	});
	// Theme selection
	rc.context('#rc-theme-menu').find('a').on('click', function() {
		var href = '//netdna.bootstrapcdn.com/bootswatch/3.0.2/#[href]/bootstrap.min.css'
		var name = (rc.context(this).attr('data-value') || '').toLowerCase();
		rc.context('#rc-theme-link').attr('href',href.replace('#[href]',name));
		rc.context('#rc-theme-link').attr('data-name',name);
	});
};

rc.validateGivingPaymentFields = function() {
	//is giving frequency field on the page
	var hasGivingFrequencyField = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_frequency__c"]').val() != undefined ? true : false;
	//is giving amount field on the page
	var hasGivingAmountField = $('.rc-component-merge-field-content').find('[name="'+rc.ns+'giving_giving_amount__c"]').val() != undefined ? true : false;
	if (hasGivingFrequencyField == true && hasGivingAmountField == false) {
		rc.ui.showMessagePopup(rc.ui.ERROR,"The Giving Amount field is not on the form. Please add and retry saving the form");
		return;
	}
	if (hasGivingFrequencyField == false && hasGivingAmountField == true) {
		rc.ui.showMessagePopup(rc.ui.ERROR,"The Giving frequency field is not on the form. Please add and retry saving the form");
		return;
	}
};

rc.selectFieldInfoList = function() {
	console.log('rc.selectFieldInfoList');
	rc.remoting.invokeAction(rc.actions.selectFieldInfoList, rc.selectFieldInfoList.done);
	rc.ui.markProcessing();
};

rc.selectFieldInfoList.done = function(response) {
	var list = rc.context('#rc-modal-insert-component--merge-field-list');
	list.empty();
	rc.context(response).each(function() {
		var item = rc.context('<a class="list-group-item rc-toggle-active"></a>');
		item.attr('data-api-name', this.Name);
		item.attr('data-api-type', '');
		item.attr('data-loaded', 'false');
		list.append(item);
	});
	// Unmark processing
	rc.ui.markProcessingDone();
	// Kickoff the re-describe process
	rc.selectFieldInfo();
};

rc.selectFieldInfo = function() {
	console.log('rc.selectFieldInfo');
	// find the first set of items without a type
	var list = rc.context('#rc-modal-insert-component--merge-field-list');
	var data_list = [];
	list.find('.list-group-item[data-loaded="false"]').each(function() {
		if (data_list.length < 50) {data_list.push({Name:rc.context(this).attr('data-api-name')});}
	});
	console.log('requesting for ', data_list);
	if (data_list.length > 0) {
		rc.remoting.invokeAction(rc.actions.selectFieldInfo, data_list, rc.selectFieldInfo.done);
		rc.ui.markProcessing();
	}
};

rc.selectFieldInfo.done = function(response) {
	console.log('rc.selectFieldInfo.done', response);
	var list = rc.context('#rc-modal-insert-component--merge-field-list');
	rc.context(response).each(function() {
		var item = list.find('[data-api-name="' + this.Name + '"]');
		item.attr('data-api-type', this.Type);
		item.attr('data-text', this.Label);
		item.attr('data-local-name', this.LocalName);
		item.attr('data-loaded', 'true');
		item.text(this.Label);
		// Create the filter text so this can be searched
		item.attr('data-filter-text', this.Name + '?' + this.Label)
		// Bind events to clicking
		item.on('click', rc.toggleMergeFieldSelected);
	});
	rc.ui.markProcessingDone();
	// Kickoff the re-describe process
	rc.selectFieldInfo();
};

rc.toggleMergeFieldSelected = function() {
	// When one of the field info links is clicked, copy the values down to the siblings
	console.log('rc.toggleMergeFieldSelected', this);
	var item = rc.context(this);
	var form = item.closest('.rc-component-overview');
	form.find('.form-control[data-cascade="data-merge-field-text"]').val(item.attr('data-text'));
	form.find('.form-control[data-cascade="data-merge-field-api-name"]').val(item.attr('data-api-name'));
	form.find('.form-control[data-cascade="data-merge-field-api-type"]').val(item.attr('data-api-type'));
	// Hide the dropdown menu
	item.closest('.dropdown-menu').hide();
};

rc.deleteFormData = function() {
	console.log('rc.deleteFormData');
	// Toggle the button
	rc.context('.page-header [data-action="rc-action-save"]').button('deleting');
	rc.context('.page-header [data-action="rc-action-save"]').addClass('btn-danger');
	// Send to salesforce
	rc.remoting.invokeAction(rc.actions.deleteFormData, rc.campaignId, rc.getParam('form'), rc.deleteFormData.done);
	// Mark processing
	rc.ui.markProcessing();
};

rc.deleteFormData.done = function(data) {
	console.log('rc.deleteFormData.done', data);
	// Toggle the buttons
	rc.context('.page-header [data-action="rc-action-save"]').button('save');
	rc.context('.page-header [data-action="rc-action-save"]').removeClass('btn-danger');
	// Unmark processing
	rc.ui.markProcessingDone({ modified: false });
	// Remove selected form ID
	rc.setParam('form', null);
	// Reselect names
	rc.selectFormInfoList();
};

rc.ui.toggleContentEditable = function() {
	var editable = 'edit' == rc.context(this).attr('data-value');
	rc.context('#rc-container-list').find('[contenteditable]').attr('contenteditable', editable);
	//trigger view changed events so all listeners to this event may take action
	rc.events.trigger('view-change',editable);
};

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
	console.log('rc.modal.loadContainerCSS', this);
	var component = rc.context('.rc-selected').filter(':first');
	var context = rc.context(this).find('.rc-cascade-value-target');
	console.log('using component:', component);
	console.log('using context:', context);
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
		console.log('match', attr);
		var controls = context.find('[data-cascade^="' + attr.name + '"]');
		//controls.filter('.btn-default').click();
		//trigger change event so cascade input will cascade value to parent target-data
		controls.filter('input,textarea').val(attr.value).change();
		controls.filter('[data-value="' + attr.value + '"]').click();
	});
};

rc.modal.saveContainerCSS = function() {
	console.log('rc.modal.saveContainerCSS', this);
	var component = rc.context('.rc-selected').filter(':first');
	var context = rc.context(this).closest('.rc-cascade-value-target');
	console.log('using component:', component);
	console.log('using context:', context);
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
	console.log('rc.modal.loadContainerColumns', this);
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
	console.log('rc.modal.saveContainerColumns', this);
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
	console.log('rc.modal.loadInsertComponent', this);
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
	console.log('rc.modal.saveInsertComponent', this);
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
	console.log('rc.modal.confirmClone', this);
	var component = rc.context('.rc-selected');
	var component_clone = component.clone();
	component.after(component_clone);
	rc.components.initialize(component_clone);// Re-initialize
	rc.context(this).closest('.modal').modal('hide');// Dismiss modal
	rc.context('.rc-selected').removeClass('rc-selected');// Unselect for safety
	rc.ui.markUnsavedChanges();// Mark changed
};

rc.modal.confirmDelete = function() {
	console.log('rc.modal.confirmDelete', this);
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


rc.upsertFormData = function(send, deferred) {
	console.log('rc.upsertFormData send:',send);
	//validate campaign ask merge fields: Giving payment frequency, Giving amount
	rc.validateGivingPaymentFields();
	// Options
	send = send || {};
	send.name = send.name || rc.context('#rc-form-name-list').siblings().find('.dropdown-toggle-text').text();
	send.type = send.type || 'update';
	send.form = { name: send.name, containers: [], workflows: [], json_version: "0.2", data: {} , styles:{} };
	deferred = deferred || new jQuery.Deferred();
	// Theme
	send.form.data['theme-name'] = rc.context('#rc-theme-link').attr('data-name');
	send.form.data['theme-href'] = rc.context('#rc-theme-link').attr('href');
	//save validator on/off flag
	send.form.data['validations-enabled'] = rc.context("#validations-enabled").is(":checked") ? "true" : "false";
	// Save Page level Styles
	rc.context(rc.context("html").get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-')) {
			var name = attr.name.replace('css-', '');
			send.form.styles[name] = attr.value;
		}
	});
	rc.context('#rc-container-list').find('.rc-container-column-list').each(function() {
		rc.upsertFormData.exportFormContainer(send.form.containers, this);
	});
	rc.context('#rc-workflows-list').find('.rc-container-workflow').each(function() {
		rc.upsertFormData.exportFormWorkflow(send.form.workflows, this);
	});
	// Toggle the button if error fail the save
	if (rc.context('.input-group.has-error,.form-group.has-error').length != 0) {
		// Toggle the button
		rc.context('.page-header [data-action="rc-action-save"]').button('error').removeClass("btn-success").addClass("btn-danger");
		return;
	} else {
		rc.context('.page-header [data-action="rc-action-save"]').button('saving').removeClass("btn-danger").addClass("btn-success");
	}
	// Send to salesforce
	if ('insert' == send.type) {
		rc.remoting.invokeAction(rc.actions.upsertFormData, rc.campaignId, null, send.form, function(recv, meta) {
			rc.upsertFormData.done(deferred, send, recv, meta);
		});
		rc.ui.markProcessing();
	}
	if ('update' == send.type) {
		rc.remoting.invokeAction(rc.actions.upsertFormData, rc.campaignId, rc.getParam('form'), send.form, function(recv, meta) {
			rc.upsertFormData.done(deferred, send, recv, meta);
		});
		rc.ui.markProcessing();
	}
	return deferred.promise();
};

rc.upsertFormData.done = function(deferred, send, recv, meta) {
	console.log('rc.upsertFormData.done');
	console.log('deferred', deferred);
	console.log('send', send);
	console.log('recv', recv);
	console.log('meta', meta);
	recv = recv || {};
	rc.context('.page-header [data-action="rc-action-save"]').button('save');// Toggle the button
	rc.ui.markProcessingDone({modified:false});// Unmark processing
	// If the returned ID is different from the current one, redirect
	if (rc.getParam('form') != recv.id) {
		rc.setParam('form', recv.id);
		rc.selectFormInfoList();
	} else {
		rc.selectFormData();
	}
	if (deferred && deferred.resolve) {deferred.resolve();}// Mark resolved?
};

rc.upsertFormData.exportFormContainer = function(list, item) {
	var list = list || [];
	var item = rc.context(item);
	// Setup data
	var data = {};
	data.columns = [];
	data.data = {};
	data.data['columns'] = parseInt(item.attr('data-columns'));
	data.data['guid'] = item.attr('id') || rc.guid();
	data.styles = {};
	// Styles
	rc.context(item.get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-')) {
			var name = attr.name.replace('css-', '');
			data.styles[name] = attr.value;
		}
	});
	item.find('.rc-container-column').each(function() {
		rc.upsertFormData.exportFormColumn(data.columns, this);
	});
	list.push(data);
};

rc.upsertFormData.exportFormColumn = function(list, item) {
	var list = list || [];
	var item = rc.context(item);
	// Setup data
	var data = {};
	data.components = [];
	data.data = {};
	data.data['position'] = parseInt(item.attr('data-position'));
	data.data['size'] = parseInt(item.attr('data-size'));
	item.find('.rc-component').each(function() {
		rc.upsertFormData.exportFormComponent(data.components, this);
	});
	list.push(data);
};

rc.upsertFormData.exportFormComponent = function(list, item) {
	var list = list || [];
	var item = rc.context(item);
	// Setup data
	var data = {};
	data.styles = {};
	data.type = item.attr('data-component-type');
	data.data = {};
	data.data['guid'] = item.attr('id') || rc.guid();
	data.data['customHidden'] = item.find(".rc-component-content").attr("data-field-hidden");
	data.defaultValues = {};
	data.placeholderValues = {};
	if (data.type == 'advanced-css') {
		data.data['text'] = item.find('textarea').val();
	}
	if (data.type == 'address') {
		//create map of field name and required flags.
		rc.context(rc.context(item).find("[data-field-name]")).each(function() {
			var key = "req-"+rc.context(this).attr("data-field-name");
			var value = rc.context(this).find("[data-required]").attr("data-required");
			data.data[key] = value;
			// map of defualt values (create map of field name and default values)
			// map of placeholder values (create map of field name and placeholder values)
			rc.context( rc.context(item).find('.rc-field-name') ).each(function() {
				rc.upsertFormData.exportformDefaultValues(data.defaultValues, rc.context(this));
				rc.upsertFormData.exportFormPlaceholderValues(data.placeholderValues, rc.context(this));
			});
		});
	}
	if (data.type == 'button') {
		data.data['text'] = item.find('.rc-component-content .rc-name').text().trim();
		data.data['workflow'] = item.attr('data-workflow');
	}
	if (data.type == 'credit-card') {
		//save data for all hidden fields
		var component = rc.context(item);
		component.find('[data-field-hidden="true"]').each(function(index,hiddenField) {
			var formControlInput = rc.context(hiddenField).find(".form-control");
			var fieldName = formControlInput.attr("name");
			if (!fieldName || fieldName=='') {
				return true;
			}
			var fieldValue = '';
			if (formControlInput.attr("type")=="text") {
				fieldValue = formControlInput.val();
			} else if (formControlInput.attr("type")=="checkbox") {
				fieldValue = formControlInput.is(":checked") ? "true" : "false";
			}
			data.data[fieldName] = fieldValue;
		});
		// map of placeholder values
		rc.context(rc.context(item).find("[data-field-name]") ).each(function() {
			rc.context( rc.context(item).find('.rc-field-name') ).each(function() {
				rc.upsertFormData.exportformDefaultValues(data.defaultValues, rc.context(this));
				rc.upsertFormData.exportFormPlaceholderValues(data.placeholderValues, rc.context(this));
			});
		});
	}
	if (data.type == 'external-stylesheet') {
		data.data['text'] = item.find('.rc-component-content .form-control').val();
	}
	if (data.type == 'external-javascript') {
		data.data['text'] = item.find('.rc-component-content .form-control').val();
	}
	if (data.type == 'internal-javascript') {
		data.data['text'] = item.find('.rc-component-content .form-control').val();
	}
	if (data.type == 'image') {
		data.data['data'] = item.find('img').attr('src');
	}
	if (data.type == 'jumbotron') {
		data.data['header'] = item.find('.rc-header').text();
		data.data['text'] = item.find('.rc-text').text();
	}
	if (data.type == 'merge-field') {
		console.log('rc.upsertFormData.exportFormComponent - default : ', item.attr("data-field-default"));
		data.data['default'] = item.find('.rc-field-name').attr('data-field-default');
		data.data['hidden'] = item.attr('data-hidden');
		data.data['name'] = item.find('.rc-field-name').attr('name');
		data.data['required'] = item.find('.input-group').attr('data-required') == 'true';
		data.data['text'] = item.find('.rc-field-text').text();
		data.data['type'] = item.attr('data-type');
		// map of defualt values
		rc.upsertFormData.exportformDefaultValues(data.defaultValues, rc.context(item.find('.rc-field-name')));
		rc.upsertFormData.exportFormPlaceholderValues(data.placeholderValues, rc.context(item.find('.rc-field-name')));
	}
	if (data.type == 'simple-header') {
		data.data['text'] = item.find('.rc-component-content').text();
	}
	if (data.type == 'simple-text') {
		data.data['text'] = item.find('.rc-component-content').text();
	}
	if (data.type == 'html-block') {
		data.data['text'] = rc.context.data(item.find(".rc-component-html-content .rc-value")[0],"html-content");
		if (data.data['text'].indexOf("<script") != -1) {
			rc.ui.addMessageToComponent(item,'Script tag is not allowed in HTML block, will be removed.', rc.ui.WARNING);
			rc.context(item).find('.form-group').addClass('has-error');
		} else {
			rc.context(item).find('.form-group').removeClass('has-error');
		}
		data.data['text'] = rc.stripTags(data.data["text"],"script");
	}
	if (data.type == 'url-link') {
		data.data['label'] = item.find(".rc-url-label input.form-control").val();
		data.data['link'] = item.find(".rc-url-link input.form-control").val();
	}
	if (data.type == 'campaign-ask') {
		data.data['required'] = item.find('.input-group').attr('data-required') == 'true';
		data.data['text-1'] = item.find(".text-1").text();
		data.data['text-2'] = item.find(".text-2").text();
		if (data.data['required'] == "false") {
			item.find('.input-group').hide();
		}
	}
	//rcEvents components
	//export cart data
	if (data.type == 'cart') {
		data.data['header'] = item.find(".cart-header-text").text();
		data.data['required'] = item.find('.input-group').attr('data-required') == 'true';
		data.data = rc.components.Cart.populateSetupSaveData(item,data.data);
	}
	if (data.type == 'session') {
		data.data['header'] = item.find('.session-header-text').text();
		data.data['required'] = item.find('.input-group').attr('data-required') == 'true';
		data.data = rc.components.Session.populateSetupSaveData(item,data.data);
	}
	if (data.type == 'attribute') {
		data.data['attribute_id'] = item.find('.attribute-select').val();
		data.data['productSlot'] = item.find('.rc-field-name').attr("name");
		data.data['required'] = item.find('.input-group').attr('data-required') == 'true';
	}
	//save validators data
	var validatorData = rc.validateInput.populateUpsertFormData(item);
	data = $.extend(data, validatorData);
	// Styles
	rc.context(item.get(0).attributes).each(function(index, attr) {
		if (attr.name.match('css-')) {
			var name = attr.name.replace('css-', '');
			data.styles[name] = attr.value;
		}
	});
	list.push(data);
};

rc.upsertFormData.exportFormWorkflow = function(list, item) {
	var list = list || [];
	var item = rc.context(item);
	// Setup data
	var data = {};
	data.actions = [];
	data.data = {};
	data.data['guid'] = item.attr('id') || rc.guid();
	data.data['name'] = item.find('.rc-workflow-name').val();
	data.data['active'] = item.find('.rc-workflow-active').is(':checked');
	// Add actions
	item.find('.rc-component').each(function() {
		rc.upsertFormData.exportFormWorkflowAction(data.actions, this);
	});
	list.push(data);
};

rc.upsertFormData.exportFormWorkflowAction = function(list, item) {
	var list = list || [];
	var item = rc.context(item);
	var data = {};
	data.context = item.attr('data-context') || 'then';
	data.method = item.attr('data-method') || '';
	data.data = {};
	data.data['guid'] = item.attr('id') || rc.guid();
	if (data.method == 'send-mail') {
		data.data['mail-to'] = item.attr('data-mail-to');
		data.data['mail-reply-to'] = item.attr('data-mail-reply-to');
		data.data['mail-subject'] = item.attr('data-mail-subject');
		data.data['mail-body'] = item.attr('data-mail-body');
	} else if (data.method == 'send-payment' && item.attr('data-value') == 'corduro') {
		data.data['data'] = item.attr('data-value');
		data.data['auth-token'] = item.attr('data-auth-token');
		data.data['auth-only'] = item.attr('data-auth-only');
		data.data['test-only'] = item.attr('data-test-only');
	} else if (data.method == 'send-payment' && item.attr('data-value') == 'iATS') {
		data.data['data'] = item.attr('data-value');
	} else if (data.method == 'send-payment' && item.attr('data-value') == 'Litle') {
		data.data['data'] = item.attr('data-value');
		data.data['advanced-fraud-detection'] = item.attr('data-advanced-fraud-detection');
		var isAdvancedFraudDetectionTestMode = item.attr('data-advanced-fraud-detection-test-mode');
		data.data['advanced-fraud-detection-test-mode'] = isAdvancedFraudDetectionTestMode;
		if (isAdvancedFraudDetectionTestMode == 'true') {
			data.data['sessionId'] = item.attr('data-sessionId');
		} else {
			data.data['sessionId'] = '';
		}
	} else if (data.method == 'send-payment' && item.attr('data-value') == 'Authorize.net') {
		data.data['data'] = item.attr('data-value');
	} else if (data.method == 'send-payment' && item.attr('data-value') == 'Cybersource') {
		data.data['data'] = item.attr('data-value');
	} else if (data.method == 'copy-param') {
		data.data['data'] = item.attr('data-value');
		data.data['parameter'] = item.attr('data-parameter');
	} else if (data.method ==  'send-data') {
		data.data['exclude-giving'] = item.attr('exclude-giving');
		data.data['exclude-events'] = item.attr('exclude-events');
		data.data['data'] = item.attr('data-value');
	} else {
		data.data['data'] = item.attr('data-value');
	}
	list.push(data);
};

rc.upsertFormData.exportformDefaultValues = function(defaultValues, item) {
	defaultValues = defaultValues || {};
	item = rc.context(item);
	var name = item.attr('name') || '';
	defaultValues[name] = item.attr('data-field-default') || '';
	return true;
};

rc.upsertFormData.exportFormPlaceholderValues = function(placeholderValues, item) {
	console.log('rc.upsertFormData.exportFormPlaceholderValues');
	placeholderValues = placeholderValues || {};
	item = rc.context(item) || '';
	var name = item.attr('name') || '';
	placeholderValues[name] = item.attr('placeholder') || '';
	return true;
};

rc.initializeFormAppInDesignMode();
