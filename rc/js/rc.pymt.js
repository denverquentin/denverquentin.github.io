console.log('loaded rc.pymt.js');
rc.wf.integrations = rc.wf.integrations || {};

rc.wf.integrations.isModeValid = function() {
	if (rc.getCurrentMode() != 'view') {return false;}
	if (rc.isEditMode) {return false;}
	console.log('rc.wf.integrations.isModeValid = true');
	return true;// all good
}

rc.wf.integrations.Corduro = function(deferred, action) {
	console.log('rc.wf.integrations.Corduro');

	if (!rc.wf.integrations.isModeValid()) {
		return deferred.reject('Internal error: form is not running in a public sites context.');
	}
	if (!action.attr('data-auth-token')) {
		return deferred.reject('Configuration error: authorization token is blank/missing');
	}
	if (!action.attr('data-auth-only')) {
		return deferred.reject('Configuration error: auth-only (true/false) is blank/missing');
	}
	if (!action.attr('data-test-only')) {
		return deferred.reject('Configuration error: test-only (true/false) is blank/missing');
	}
	var snap_token = action.attr('data-auth-token');
	if (action.attr('data-auth-only') == 'true') { // Production or test mode
		rc.wf.integrations.Corduro.snap = new SNAP2(true, snap_token, '');
	} else {
		rc.wf.integrations.Corduro.snap = new SNAP2(false, '', snap_token);
	}
	var snap = rc.wf.integrations.Corduro.snap;
	snap.amount = '0';
	snap.cssStyleURL = '';
	snap.divName = 'corduro_snap';
	snap.companyName = action.attr('data-auth-only') || 'Test Company';
	snap.authOnly = action.attr('data-auth-only') == 'true' ? 'AUTHONLY' : null;
	snap.showAmount = true;
	snap.showCredit = true;
	snap.showAmex = true;
	snap.showMC = true;
	snap.showVisa = true;
	snap.emailVisible = false;
	snap.vault = true;
	snap.callbackFunction = function(recv) {
		$('#rc-modal-processing').modal('hide');
		try {
			rc.wf.integrations.Corduro.done(deferred, action, recv);
		} catch (message) {
			return deferred.reject(message);
		}
	};
};

rc.wf.integrations.Corduro.send = function(deferred, action) {
	console.log('rc.wf.integrations.Corduro.send');
	// Just for UI, make all the SNAP inputs into nice design (even if it is hidden)
	console.log('$(#corduro_snap) = ' + $('#corduro_snap'));
	$('#corduro_snap').find('input[type="text"]').addClass('form-control');
	$('#corduro_snap').find('input[type="submit"]').addClass('btn btn-default');
	$('#corduro_snap').find('select').addClass('form-control');
	$('#corduro_snap').find('.popup_header_bill').remove();
	var context = null;
	var data_map = {};
	//set amount
	var snap = rc.wf.integrations.Corduro.snap;
	console.log('snap = ' + snap);
	if (snap) {
		//currently corduro only support one time payment
		if (action.paymentDetails && action.paymentDetails.frequency==='One Payment') {
			var amount = action.paymentDetails.eventGivingAmount || 0.0;
			snap.updateAmount(amount.toString());
		} else {
			snap.updateAmount('0');
		}
	}
	// Standard naming
	data_map['input[name="'+rc.ns+'address_street_line_1__c"]'] = {target:'#corduro_snap [id^="f_address1"]',fieldName:rc.ns+'address_street_line_1__c'};
	data_map['input[name="'+rc.ns+'address_street_line_2__c"]'] = {target:'#corduro_snap [id^="f_address2"]',fieldName:rc.ns+'address_street_line_2__c'};
	data_map['input[name="'+rc.ns+'address_city__c"]'] = {target:'#corduro_snap [id^="f_city"]',fieldName:rc.ns+'address_city__c'};
	data_map['input[name="'+rc.ns+'address_country__c"]'] = {target:'#corduro_snap [id^="f_country"]',fieldName:rc.ns+'address_country__c'};
	data_map['input[name="'+rc.ns+'address_postal_code__c"]'] = {target:'#corduro_snap [id^="f_zip"]',fieldName:rc.ns+'address_postal_code__c'};
	data_map['input[name="'+rc.ns+'address_state__c"]'] = {target:'#corduro_snap [id^="f_state"]',fieldName:rc.ns+'address_state__c'};
	data_map['input[name="'+rc.ns+'contact_1_email__c"]'] = {target:'#corduro_snap [id^="f_email"]',fieldName:rc.ns+'contact_1_email__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_holder_name__c"]'] = {target:'#corduro_snap [id^="f_name_on_card"]',fieldName:rc.ns+'payment_method_card_holder_name__c'};
	// Local only fields
	data_map['input[data-name="'+rc.ns+'payment_method_card_number__c"]'] = {target:'#corduro_snap [id^="f_card_no"]',fieldName:rc.ns+'payment_method_card_number__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_month__c"]'] = {target:'#corduro_snap [id^="f_exp_month"]',fieldName:rc.ns+'payment_method_card_expiration_month__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_year__c"]'] = {target:'#corduro_snap [id^="f_exp_year"]',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	data_map['input[data-name="'+rc.ns+'payment_method_card_security_code__c"]'] ={target:'#corduro_snap [id^="f_CID"]',fieldName:rc.ns+'payment_method_card_security_code__c'};
	// Find and convert fields
	$.each(data_map, function(source, targetData) {
		var data = rc.dataModal.getFieldByName(targetData.fieldName,source);
		console.log('data = ' + data);
		$(targetData.target).val(data);
	});
	// If there were no values copied for certain required fields, set defaults
	context = $('#corduro_snap').find('[id^="f_country"]');
	console.log('context1 = ' + context);
	context.val(context.val() || 'United States');
	context = $('#corduro_snap').find('[id^="f_email"]');
	console.log('context2 = ' + context);
	context.val(context.val() || 'undefined@example.com');
	// todo: this doesn't make much sense - hide on next line then evaluate if it's hidden at bottom of method?
	$('#process_animcorduro_snap').hide();// Hide the processing animation
	$('#corduro_snap').find('input[type="submit"].form_button_donate').click();// Click the button
	// If the animation is showing, it means the SNAP widget had no failures.
	if ($('#process_animcorduro_snap').css('display') == 'block') {
		console.log('all good');
		$('#rc-modal-processing').modal('show');
	} else {
		console.log('no good');
		$('#rc-modal-processing').modal('hide');
	}
};

rc.wf.integrations.Corduro.done = function(deferred, action, recv) {
	console.log('rc.wf.integrations.Corduro.done');
	recv = recv || {};
	deferred = deferred || new jQuery.Deferred();
	var transactionType = action.attr('data-auth-only') == 'true' ? '' : 'Charge';
	var isPaymentPaid = recv.approvalstatus=='APPROVED' ? 'true' : 'false';
	//common input
	$('fields[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(recv.maskcardno.replace(/\*/g, ''));
	$('input[name="'+rc.ns+'payment_method_card_guid__c"]').val(recv.vaultguid);
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(recv.cardtype);
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val('Corduro');
	if (action.paymentDetails.isGiving==true) {
		$('input[name="'+rc.ns+'giving_transaction_type__c"]').val(transactionType);
		$('input[name="'+rc.ns+'giving_close_date__c"]').val(rc.dateValue);
		$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(rc.dateTimeValue);
		$('input[name="'+rc.ns+'giving_giving_frequency__c"]').val('One Payment');
		var paidFlagGiving = action.attr('data-auth-only') == 'true' ? 'false' : isPaymentPaid;
		var isPaidBool = paidFlagGiving == 'true';
		$('input[name="'+rc.ns+'giving_paid__c"]').val(paidFlagGiving).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
	}
	if (action.paymentDetails.isEvent==true) {
		var paidFlagEvent = action.attr('data-auth-only') == 'true' ? 'false' : isPaymentPaid;
		var isPaidBool = paidFlagEvent == 'true';
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val(paidFlagEvent).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
	}
	//change status after saving data to record so we can track failures
	console.log('recv.approvalstatus = ' + recv.approvalstatus);
	if (recv.approvalstatus != 'APPROVED') {
		return deferred.reject('Denied: ' + recv.approvalstatus);
	}
	deferred.resolve();
};


rc.wf.integrations.IATS = function(deferred, action) {
	if (!rc.wf.integrations.isModeValid()) {
		return deferred.reject('Internal error: form is not running in a public sites context.');
	}
	return rc.wf.integrations.IATS.send(deferred,action);// Initialize IATS
};

rc.wf.integrations.IATS.send = function(deferred, action) {
	var context = null;
	var data_map = {};
	var data_send_map = {};
	// Standard naming
	data_map['input[name="'+rc.ns+'address_street_line_1__c"]'] = {target:'address',fieldName:rc.ns+'address_street_line_1__c'};
	data_map['input[name="'+rc.ns+'address_city__c"]'] = {target:'address_city',fieldName:rc.ns+'address_city__c'};
	data_map['input[name="'+rc.ns+'address_country__c"]'] = {target:'address_country',fieldName:rc.ns+'address_country__c'};
	data_map['input[name="'+rc.ns+'address_postal_code__c"]'] = {target:'address_postal_code',fieldName:rc.ns+'address_postal_code__c'};
	data_map['input[name="'+rc.ns+'address_state__c"]'] = {target:'address_state',fieldName:rc.ns+'address_state__c'};
	data_map['input[name="'+rc.ns+'contact_1_email__c"]'] = {target:'contact_1_email',fieldName:rc.ns+'contact_1_email__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_holder_name__c"]'] = {target:'payment_method_card_holder_name',fieldName:rc.ns+'payment_method_card_holder_name__c'};
	// Local only fields
	data_map['input[data-name="'+rc.ns+'payment_method_card_number__c"]'] = {target:'payment_method_card_number',fieldName:rc.ns+'payment_method_card_number__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_month__c"]'] = {target:'payment_method_card_expiration_month',fieldName:rc.ns+'payment_method_card_expiration_month__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_year__c"]'] = {target:'payment_method_card_expiration_year',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	data_map['input[data-name="'+rc.ns+'payment_method_card_security_code__c"]'] = {target:'payment_method_card_security_code',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	// Find and convert fields
	$.each(data_map, function(source, targetData) {
		var data = rc.dataModal.getFieldByName(targetData.fieldName,source);
		data_send_map[targetData.target] = data;
	});
	//Calculated Event and giving amount to process one transation for both
	data_send_map['amount'] = action.paymentDetails.eventGivingAmount || 0.0;
	data_send_map['merchant_name'] = rc.merchantName;
	data_send_map.__action = rc.actions.processIATSPayment;
	rc.remoting.invokeAction(rc.actions.processIATSPayment, data_send_map,
	function(recv) {
		try {
			rc.wf.integrations.IATS.done(deferred, action, recv);
		} catch (message) {
			return deferred.reject(message);
		}
	});
	$('#rc-modal-processing').modal('show');
};

rc.wf.integrations.IATS.done = function(deferred, action, recv) {
	recv = recv || {};
	deferred = deferred || new jQuery.Deferred();
	var isPaidBool = recv.isSuccess=='true';
	//common fields
	$('input[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(recv.lastFourDigits);
	$('input[name="'+rc.ns+'payment_method_card_guid__c"]').val(recv.CUSTOMERCODE);
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(recv.cardtype);
	$('input[data-name="'+rc.ns+'payment_method_card_security_code__c"]').attr('name',rc.ns+'payment_method_card_security_code__c');
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val('iATS');
	$('input[name="'+rc.ns+'merchant_name__c"]').val(rc.merchantName);
	$('input[name="'+rc.ns+'giving_response_code__c"]').val(recv.responseCode);
	$('input[name="'+rc.ns+'giving_response_message__c"]').val(recv.responseMessage);
	if (recv.TRANSACTIONID != undefined) {
		$('input[name="'+rc.ns+'giving_transaction_id__c"]').val(recv.TRANSACTIONID);
	}
	if (action.paymentDetails.isGiving==true) {
		// Standard naming
		$('input[name="'+rc.ns+'giving_close_date__c"]').val(recv.date);
		$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(recv.dateTime);
		$('input[name="'+rc.ns+'giving_transaction_type__c"]').val('Payment');
		$('input[name="'+rc.ns+'giving_giving_frequency__c"]').val(action.paymentDetails.frequency);
		$('input[name="'+rc.ns+'giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
	}
	if (action.paymentDetails.isEvent==true) {
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
	}
	$('#rc-modal-processing').modal('hide');
	if (recv.isSuccess != 'true') {
		$('#rc-modal-processing').modal('hide');
		return deferred.reject('Denied: ' + recv.responseMessage + '  ' + recv.responseCode);
	}
	deferred.resolve();// success
};


rc.wf.integrations.Cybersource = function(deferred, action) {
	if (!rc.wf.integrations.isModeValid()) {
		return deferred.reject('Internal error: form is not running in a public sites context.');
	}
	return rc.wf.integrations.Cybersource.send(deferred,action);// Initialize Cybersource
};

rc.wf.integrations.Cybersource.send = function(deferred, action) {
	var context = null;
	var data_map = {};
	var data_send_map = {};
	// Standard naming
	data_map['input[name="'+rc.ns+'address_street_line_1__c"]'] = {target:'address',fieldName:rc.ns+'address_street_line_1__c'};
	data_map['input[name="'+rc.ns+'address_city__c"]'] = {target:'address_city',fieldName:rc.ns+'address_city__c'};
	data_map['input[name="'+rc.ns+'address_country__c"]'] = {target:'address_country',fieldName:rc.ns+'address_country__c'};
	data_map['input[name="'+rc.ns+'address_postal_code__c"]'] = {target:'address_postal_code',fieldName:rc.ns+'address_postal_code__c'};
	data_map['input[name="'+rc.ns+'address_state__c"]'] = {target:'address_state',fieldName:rc.ns+'address_state__c'};
	data_map['input[name="'+rc.ns+'contact_1_email__c"]'] = {target:'contact_1_email',fieldName:rc.ns+'contact_1_email__c'};
	data_map['input[name="'+rc.ns+'contact_1_phone__c"]'] = {target:'contact_1_phone',fieldName:rc.ns+'contact_1_phone__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_holder_name__c"]'] = {target:'payment_method_card_holder_name',fieldName:rc.ns+'payment_method_card_holder_name__c'};
	// Local only fields
	data_map['input[data-name="'+rc.ns+'payment_method_card_number__c"]'] = {target:'payment_method_card_number',fieldName:rc.ns+'payment_method_card_number__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_month__c"]'] = {target:'payment_method_card_expiration_month',fieldName:rc.ns+'payment_method_card_expiration_month__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_year__c"]'] = {target:'payment_method_card_expiration_year',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	data_map['input[data-name="'+rc.ns+'payment_method_card_security_code__c"]'] = {target:'payment_method_card_security_code',fieldName:rc.ns+'payment_method_card_security_code__c'};
	// Find and convert fields
	$.each(data_map, function(source, targetData) {
		var data = rc.dataModal.getFieldByName(targetData.fieldName,source);
		data_send_map[targetData.target] = data;
	});
	data_send_map['amount'] = action.paymentDetails.eventGivingAmount || 0.0;
	data_send_map['merchant_name'] = rc.merchantName;
	data_send_map['controllerid'] = rc.campaignId;
	data_send_map.__action = rc.actions.processCybersourcePayment;
	rc.remoting.invokeAction(rc.actions.processCybersourcePayment, data_send_map,
	function(recv, event) {
		try {
			rc.wf.integrations.Cybersource.done(deferred, action, recv);
		} catch (message) {
			return deferred.reject(message);
		}
	});
	$('#rc-modal-processing').modal('show');
};

rc.wf.integrations.Cybersource.done = function(deferred, action, recv) {
	recv = recv || {};
	deferred = deferred || new jQuery.Deferred();
	var isPaidBool = recv.isSuccess=='true';
	//common fields
	$('input[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(recv.lastFourDigits);
	$('input[name="'+rc.ns+'payment_method_card_guid__c"]').val(recv.CybersourceToken);
	//if no token then only store card number
	if (!recv.CybersourceToken) {
		$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').attr('name',rc.ns+'payment_method_card_number__c');
		$('input[data-name="'+rc.ns+'payment_method_card_security_code__c"]').attr('name',rc.ns+'payment_method_card_security_code__c');
	}
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(recv.cardtype);
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val('Cybersource');
	$('input[name="'+rc.ns+'merchant_name__c"]').val(rc.merchantName);
	if (recv.responseCode) {// collect response message
		$('input[name="'+rc.ns+'giving_response_code__c"]').val(recv.responseCode);
	}
	if (recv.responseMessage) {
		$('input[name="'+rc.ns+'giving_response_message__c"]').val(recv.responseMessage);
	}
	if (recv.TRANSACTIONID != undefined) {
		$('input[name="'+rc.ns+'giving_transaction_id__c"]').val(recv.TRANSACTIONID);
	}
	if (action.paymentDetails.isGiving==true) {
		$('input[name="'+rc.ns+'giving_close_date__c"]').val(recv.date);
		$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(recv.dateTime);
		$('input[name="'+rc.ns+'giving_transaction_type__c"]').val('Payment');
		$('input[name="'+rc.ns+'giving_giving_frequency__c"]').val(action.paymentDetails.frequency);
		$('input[name="'+rc.ns+'giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
	}
	if (action.paymentDetails.isEvent==true) {
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
	}
	$('#rc-modal-processing').modal('hide');
	// Successful or not?
	if (recv.isSuccess != 'true') {
		return deferred.reject('Denied: ' + recv.responseMessage + '  ' + recv.responseCode);
	}
	deferred.resolve();// success
};


rc.wf.integrations.Litle = function(deferred, action) {
	if (!rc.wf.integrations.isModeValid()) {
		return deferred.reject('Internal error: form is not running in a public sites context.');
	}
	return rc.wf.integrations.Litle.send(deferred,action);// Initialize Litle
};

rc.wf.integrations.Litle.send = function(deferred, action) {
	var context = null;
	var data_map = {};
	var data_send_map = {};
	// Standard naming
	data_map['input[name="'+rc.ns+'address_street_line_1__c"]'] = {target:'address',fieldName:rc.ns+'address_street_line_1__c'};
	// todo: don't thinks this is mapped correctly? on purpose?
	data_map['input[name=]'] = {target:'address_city',fieldName:rc.ns+'address_city__c'};
	data_map['input[name="'+rc.ns+'address_country__c"]'] = {target:'address_country',fieldName:rc.ns+'address_country__c'};
	data_map['input[name="'+rc.ns+'address_postal_code__c"]'] = {target:'address_postal_code',fieldName:rc.ns+'address_postal_code__c'};
	data_map['input[name="'+rc.ns+'address_state__c"]'] = {target:'address_state',fieldName:rc.ns+'address_state__c'};
	data_map['input[name="'+rc.ns+'contact_1_email__c"]'] = {target:'contact_1_email',fieldName:rc.ns+'contact_1_email__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_holder_name__c"]'] = {target:'payment_method_card_holder_name',fieldName:rc.ns+'payment_method_card_holder_name__c'};
	// Local only fields
	data_map['input[data-name="'+rc.ns+'payment_method_card_number__c"]'] = {target:'payment_method_card_number',fieldName:rc.ns+'payment_method_card_number__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_month__c"]'] = {target:'payment_method_card_expiration_month',fieldName:rc.ns+'payment_method_card_expiration_month__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_year__c"]'] = {target:'payment_method_card_expiration_year',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	data_map['input[data-name="'+rc.ns+'payment_method_card_security_code__c"]'] = {target:'payment_method_card_security_code',fieldName:rc.ns+'payment_method_card_security_code__c'};
	// Find and convert fields
	$.each(data_map, function(source, targetData) {
		var data = rc.dataModal.getFieldByName(targetData.fieldName,source);
		data_send_map[targetData.target] = data;
	});
	//Calculated Event and giving amount to process one transation for both
	data_send_map['amount'] = action.paymentDetails.eventGivingAmount || 0.0;
	data_send_map['merchant_name'] = rc.merchantName;
	data_send_map['isAdvancedFraudDetection'] = $(action).attr('data-advanced-fraud-detection');
	data_send_map['sessionId'] = rc.sessionId;
	data_send_map.__action = rc.actions.processLitlePayment;
	rc.remoting.invokeAction(rc.actions.processLitlePayment, data_send_map,
	function(recv) {
		try {
			rc.wf.integrations.Litle.done(deferred, action, recv);
		} catch (message) {
			return deferred.reject(message);
		}
	});
	$('#rc-modal-processing').modal('show');
};

rc.wf.integrations.Litle.done = function(deferred, action, recv) {
	recv = recv || {};
	deferred = deferred || new jQuery.Deferred();
	var isPaidBool = recv.isSuccess=='true';
	//common fields
	$('input[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(recv.lastFourDigits);
	$('input[name="'+rc.ns+'payment_method_card_guid__c"]').val(recv.litleToken);
	//if no token then only store card number
	if (!recv.litleToken) {
		$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').attr('name',rc.ns+'payment_method_card_number__c');//val(recv.cardnumber);
		$('input[data-name="'+rc.ns+'payment_method_card_security_code__c"]').attr('name',rc.ns+'payment_method_card_security_code__c');
	}
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(recv.cardtype);
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val('Litle');
	$('input[name="'+rc.ns+'merchant_name__c"]').val(rc.merchantName);
	if (recv.responseCode) {
		$('input[name="'+rc.ns+'giving_response_code__c"]').val(recv.responseCode);
	}
	if (recv.responseMessage) {
		$('input[name="'+rc.ns+'giving_response_message__c"]').val(recv.responseMessage);
	}
	if (recv.isAvancedFraudDetection) {
		var response = $('input[name="'+rc.ns+'giving_response_message__c"]').val();
		if (recv.deviceReviewStatus) {
			response = response + ';deviceReviewStatus:'+recv.deviceReviewStatus;
		}
		if (recv.deviceReputationScore) {
			response = response + ';deviceReputationScore:'+recv.deviceReputationScore
		}
		$('input[name="'+rc.ns+'giving_response_message__c"]').val(response);
	}
	if (recv.TRANSACTIONID != undefined) {
		$('input[name="'+rc.ns+'giving_transaction_id__c"]').val(recv.TRANSACTIONID);
	}
	if (action.paymentDetails.isGiving == true) {
		$('input[name="'+rc.ns+'giving_close_date__c"]').val(recv.date);
		$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(recv.dateTime);
		$('input[name="'+rc.ns+'giving_transaction_type__c"]').val('Payment');
		$('input[name="'+rc.ns+'giving_giving_frequency__c"]').val(action.paymentDetails.frequency);
		$('input[name="'+rc.ns+'giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
	}
	if (action.paymentDetails.isEvent == true) {
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
	}
	$('#rc-modal-processing').modal('hide');
	if (recv.isSuccess != 'true') {
		return deferred.reject('Denied: ' + recv.responseMessage + '  ' + recv.responseCode);
	}
	deferred.resolve();// success
};


rc.wf.integrations.AuthDotNet = function(deferred, action) {
	if (!rc.wf.integrations.isModeValid()) {
		return deferred.reject('Internal error: form is not running in a public sites context.');
	}
	return rc.wf.integrations.AuthDotNet.send(deferred,action);// Initialize PayPal
};

rc.wf.integrations.AuthDotNet.send = function(deferred, action) {
	var context = null;
	var data_map = {};
	var data_send_map = {};
	// Standard naming
	data_map['input[name="'+rc.ns+'address_street_line_1__c"]'] = {target:'address',fieldName:rc.ns+'address_street_line_1__c'};
	data_map['input[name="'+rc.ns+'address_city__c"]'] = {target:'address_city',fieldName:rc.ns+'address_city__c'};
	data_map['input[name="'+rc.ns+'address_country__c"]'] = {target:'address_country',fieldName:rc.ns+'address_country__c'};
	data_map['input[name="'+rc.ns+'address_postal_code__c"]'] = {target:'address_postal_code',fieldName:rc.ns+'address_postal_code__c'};
	data_map['input[name="'+rc.ns+'address_state__c"]'] = {target:'address_state',fieldName:rc.ns+'address_state__c'};
	data_map['input[name="'+rc.ns+'contact_1_email__c"]'] = {target:'contact_1_email',fieldName:rc.ns+'contact_1_email__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_holder_name__c"]'] = {target:'payment_method_card_holder_name',fieldName:rc.ns+'payment_method_card_holder_name__c'};
	// Local only fields
	data_map['input[data-name="'+rc.ns+'payment_method_card_number__c"]'] = {target:'payment_method_card_number',fieldName:rc.ns+'payment_method_card_number__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_month__c"]'] = {target:'payment_method_card_expiration_month',fieldName:rc.ns+'payment_method_card_expiration_month__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_year__c"]'] = {target:'payment_method_card_expiration_year',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	data_map['input[data-name="'+rc.ns+'payment_method_card_security_code__c"]'] = {target:'payment_method_card_security_code',fieldName:rc.ns+'payment_method_card_security_code__c'};
	// Find and convert fields
	$.each(data_map, function(source, targetData) {
		var data = rc.dataModal.getFieldByName(targetData.fieldName,source);
		data_send_map[targetData.target] = data;
	});
	data_send_map['amount'] = action.paymentDetails.eventGivingAmount || 0.0;
	data_send_map['merchant_name'] = rc.merchantName;
	data_send_map.__action = rc.actions.processAuthDotNetPayment;
	Visualforce.remoting.timeout = 60000;
	rc.remoting.invokeAction(rc.actions.processAuthDotNetPayment, data_send_map,
	function(recv) {
		try {
			rc.wf.integrations.AuthDotNet.done(deferred, action, recv);
		} catch (message) {
			return deferred.reject(message);
		}
	});
	$('#rc-modal-processing').modal('show');
};

rc.wf.integrations.AuthDotNet.done = function(deferred, action, recv) {
	recv = recv || {};
	deferred = deferred || new jQuery.Deferred();
	var isPaidBool = recv.isSuccess=='true';
	$('input[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(recv.lastFourDigits);
	$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').attr('name',rc.ns+'payment_method_card_number__c');
	$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').val(recv.cardnumber);
	$('input[name="'+rc.ns+'payment_method_card_expiration_month__c"]').val(recv.expmonth);
	$('input[name="'+rc.ns+'payment_method_card_expiration_year__c"]').val(recv.expyear);
	$('input[data-name="'+rc.ns+'payment_method_card_security_code__c"]').attr('name',rc.ns+'payment_method_card_security_code__c');
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(recv.cardtype);
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val('Authorize.net');
	$('input[name="'+rc.ns+'merchant_name__c"]').val(rc.merchantName);
	$('input[name="'+rc.ns+'payment_method_card_guid__c"]').val(recv.authValue);
	//Response details
	$('input[name="'+rc.ns+'giving_response_code__c"]').val(recv.responseCode);
	$('input[name="'+rc.ns+'giving_response_message__c"]').val(recv.responseMessage);
	if (recv.transId != undefined) {
		$('input[name="'+rc.ns+'giving_transaction_id__c"]').val(recv.transId);
	}
	if (action.paymentDetails.isGiving==true) {
		$('input[name="'+rc.ns+'giving_close_date__c"]').val(recv.date);
		$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(recv.dateTime);
		$('input[name="'+rc.ns+'giving_transaction_type__c"]').val('Payment');
		$('input[name="'+rc.ns+'giving_giving_frequency__c"]').val(action.paymentDetails.frequency);
		$('input[name="'+rc.ns+'giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
	}
	if (action.paymentDetails.isEvent==true) {
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
	}
	$('#rc-modal-processing').modal('hide');
	// Successful or not?
	if (recv.isSuccess != 'true') {
		return deferred.reject('Denied: ' + recv.responseMessage + '  ' + recv.responseCode);
	}
	deferred.resolve();// success
};


rc.wf.integrations.PayPal = function(deferred, action) {
	console.log('rc.wf.integrations.PayPal');
	if (!rc.wf.integrations.isModeValid()) {
		return deferred.reject('Internal error: form is not running in a public sites context.');
	}
	return rc.wf.integrations.PayPal.send(deferred,action);// Initialize PayPal
};

rc.wf.integrations.PayPal.send = function(deferred, action) {
	console.log('rc.wf.integrations.PayPal.send');
	var context = null;
	var data_map = {};
	var data_send_map = {};
	// Standard naming
	data_map['input[name="'+rc.ns+'address_street_line_1__c"]'] = {target:'address',fieldName:rc.ns+'address_street_line_1__c'};
	data_map['input[name="'+rc.ns+'address_city__c"]'] = {target:'address_city',fieldName:rc.ns+'address_city__c'};
	data_map['input[name="'+rc.ns+'address_country__c"]'] = {target:'address_country',fieldName:rc.ns+'address_country__c'};
	data_map['input[name="'+rc.ns+'address_postal_code__c"]'] = {target:'address_postal_code',fieldName:rc.ns+'address_postal_code__c'};
	data_map['input[name="'+rc.ns+'address_state__c"]'] = {target:'address_state',fieldName:rc.ns+'address_state__c'};
	data_map['input[name="'+rc.ns+'contact_1_email__c"]'] = {target:'contact_1_email',fieldName:rc.ns+'contact_1_email__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_holder_name__c"]'] = {target:'payment_method_card_holder_name',fieldName:rc.ns+'payment_method_card_holder_name__c'};
	// Local only fields
	data_map['input[data-name="'+rc.ns+'payment_method_card_number__c"]'] = {target:'payment_method_card_number',fieldName:rc.ns+'payment_method_card_number__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_month__c"]'] = {target:'payment_method_card_expiration_month',fieldName:rc.ns+'payment_method_card_expiration_month__c'};
	data_map['input[name="'+rc.ns+'payment_method_card_expiration_year__c"]'] = {target:'payment_method_card_expiration_year',fieldName:rc.ns+'payment_method_card_expiration_year__c'};
	data_map['input[data-name="'+rc.ns+'payment_method_card_security_code__c"]'] = {target:'payment_method_card_security_code',fieldName:rc.ns+'payment_method_card_security_code__c'};
	// Find and convert fields
	$.each(data_map, function(source, targetData) {
		var data = rc.dataModal.getFieldByName(targetData.fieldName,source);
		data_send_map[targetData.target] = data;
	});
	//Calculated Event and giving amount to process one transation for both
	data_send_map['amount'] = action.paymentDetails.eventGivingAmount || 0.0;
	data_send_map['merchant_name'] = rc.merchantName;
	data_send_map.__action = rc.actions.processPayPalPayment;
	Visualforce.remoting.timeout = 60000;
	rc.remoting.invokeAction(rc.actions.processPayPalPayment, data_send_map,
	function(recv) {
		try {
			rc.wf.integrations.PayPal.done(deferred, action, recv);
		} catch (message) {
			return deferred.reject(message);
		}
	});
	$('#rc-modal-processing').modal('show');
};

rc.wf.integrations.PayPal.done = function(deferred, action, recv) {
	console.log('rc.wf.integrations.PayPal.done');
	recv = recv || {};
	deferred = deferred || new jQuery.Deferred();
	var isPaidBool = recv.isSuccess=='true';
	$('input[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(recv.lastFourDigits);
	$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').attr('name',rc.ns+'payment_method_card_number__c');
	$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').val(recv.cardnumber);
	$('input[name="'+rc.ns+'payment_method_card_expiration_month__c"]').val(recv.expmonth);
	$('input[name="'+rc.ns+'payment_method_card_expiration_year__c"]').val(recv.expyear);
	$('input[data-name="'+rc.ns+'payment_method_card_security_code__c"]').attr('name',rc.ns+'payment_method_card_security_code__c');
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(recv.cardtype);
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val('PayPal');
	$('input[name="'+rc.ns+'merchant_name__c"]').val(rc.merchantName);
	$('input[name="'+rc.ns+'giving_response_code__c"]').val(recv.responseCode);
	$('input[name="'+rc.ns+'giving_response_message__c"]').val(recv.responseMessage);
	if (recv.TRANSACTIONID != undefined) {
		$('input[name="'+rc.ns+'giving_transaction_id__c"]').val(recv.TRANSACTIONID);
	}
	if (action.paymentDetails.isGiving == true) {
		$('input[name="'+rc.ns+'giving_close_date__c"]').val(recv.date);
		$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(recv.dateTime);
		$('input[name="'+rc.ns+'giving_transaction_type__c"]').val('Payment');
		$('input[name="'+rc.ns+'giving_giving_frequency__c"]').val(action.paymentDetails.frequency);
		$('input[name="'+rc.ns+'giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount);
	}
	if (action.paymentDetails.isEvent==true) {
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val(''+recv.isSuccess).prop('checked',isPaidBool);
		$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount);
	}
	// Otherwise, it's a success
	$('#rc-modal-processing').modal('hide');
	// Successful or not?
	if (recv.isSuccess != 'true') {
		return deferred.reject('Denied: ' + recv.responseMessage + '  ' + recv.responseCode);
	}
	deferred.resolve();
};


/* used by both Sage & Heartland! */
rc.wf.integrations.Sage = function(deferred, action) {
	console.log('rc.wf.integrations.Sage');
	console.log('action = ' + JSON.stringify(action));

	var cardNumber = $('input[data-name="'+rc.ns+'payment_method_card_number__c"]').val();
	cardNumber = cardNumber.replace(/\s/g,'');
	console.log('cardNumber = ' + cardNumber);
	var cardLast4Digits = $('input[data-name="'+rc.ns+'payment_method_card_number__c"]').val();
	cardLast4Digits = cardLast4Digits.replace(/[^\d]+/g, '').substring(0, 16).match(/.{1,4}/g)[3];
	console.log('cardLast4Digits = ' + cardLast4Digits);
	$('input[name="'+rc.ns+'giving_close_date__c"]').val(rc.dateValue);
	$('input[name="'+rc.ns+'giving_close_date_time__c"]').val(rc.dateTimeValue);
	$('input[data-name="'+rc.ns+'payment_method_card_number__c"]').attr('name',rc.ns+'payment_method_card_number__c');
	$('input[data-name="'+rc.ns+'payment_method_card_security_code__c"]').attr('name',rc.ns+'payment_method_card_security_code__c');
	$('input[name="'+rc.ns+'payment_method_card_last_four_digits__c"]').val(cardLast4Digits);
	$('input[name="'+rc.ns+'giving_transaction_type__c"]').val('Charge');
	$('input[name="'+rc.ns+'payment_method_payment_type__c"]').val('Charge Card');
	$('input[name="'+rc.ns+'batch_upload_campaign_matched__c"]').val(rc.campaignId);
	$('input[name="'+rc.ns+'payment_processor__c"]').val(action.attr('data-value'));
	$('input[name="'+rc.ns+'merchant_name__c"]').val(rc.merchantName);
	$('input[name="'+rc.ns+'giving_giving_amount__c"]').val(action.paymentDetails.givingAmount || 0.0);
	$('input[name="'+rc.ns+'event_purchase_giving_amount__c"]').val(action.paymentDetails.eventAmount || 0.0);
	$('input[name="'+rc.ns+'payment_method_card_issuer__c"]').val(rc.wf.process.getCreditCardType(cardNumber));
	if (action.paymentDetails.frequency == 'Monthly') {
		$('input[name="'+rc.ns+'giving_is_sustainer__c"]').val('true').prop('checked',true);
	}
	if (action.paymentDetails.isGiving==true) {
		$('input[name="'+rc.ns+'giving_paid__c"]').val('false').prop('checked',false);
	} else if (action.paymentDetails.isEvent==true) {
		$('input[name="'+rc.ns+'event_purchase_giving_paid__c"]').val('false').prop('checked',false);
	}
	// todo: added this next line - working?
	$('#rc-modal-processing').modal('hide');
	deferred.resolve();
};
