/* Put methods that are only used during the form design/edit here.
Feel free to put loads of comments in the code and be sure to minify
this script any time it's edited. The Campaign_DesignForm.page should
always load the minified version. */
console.log('LOADED rc.form.edit.js - MUST BE IN EDIT MODE!!!!');
rc = rc || {};
rc.ui = rc.ui || {};
rc.modal = rc.modal || {};

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
