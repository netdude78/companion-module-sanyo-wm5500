var telnet = require('../../telnet');
var instance_skel = require('../../instance_skel');

var actions  = require('./actions');
var feedback = require('./feedback');
var debug;
var log;

class instance extends instance_skel {

	constructor(system,id,config){
		super(system,id,config);
		
		Object.assign(this, {
			...actions,
			...feedback
		});
		
		this.projectorStatus = "";
		this.login = false;
		this.heartbeatTime = 10;
		this.heartbeatInterval = null;

		this.CHOICES_PROJECTORSTATUS = [
			{ id: 'ON', label: 'Projector On' },
			{ id: 'COOLING', label: 'Projector Cooling' },
			{ id: 'WAIT', label: 'Projector Wait' },
			{ id: 'STANDBY', label: 'Projector Standby' }
		];

		this.actions();
	}

	//Setup the actions
	actions(system) {

		this.setActions(this.getActions());
	}

	//Execute provided action
	action(action) {
		let cmd = '';
		
		switch (action.action) {
			case 'power_on':
				cmd = `C00`;
				break;

			case 'power_off':
				cmd = `C01`;
				break;

			case 'video_mute_on':
				cmd = `C0D`;
				break;

			case 'video_mute_off':
				cmd = `C0E`;
				break;
			
		}
		if (cmd != undefined && cmd != ''){
			this.socket.write(cmd + '\r\n');
			this.socket.write("CR0\r\n");
		}
	}

	//Define configuration fields for web config
	config_fields() {
		return [
			{
				type: 'text',
				id:   'info',
				width: 12,
				label: 'Information',
				value: 'Control a Sanyo WM5500 Projector'
			},
			{
				type: 'textinput',
				id:   'host',
				label: 'Target IP',
				default: '',
				width: 6,
				regex: this.REGEX_IP
			},
			{
				type: 'textinput',
				id: 'pass',
				label: 'Password',
				width: 6,
				default: '1234'
			}
		]
	}

	//Clean up intance before it is destroyed
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy();
		}
		
		if (this.heartbeatInterval !== undefined) {
			clearInterval(this.heartbeatInterval);
		}

		this.debug('DESTROY', this.id)
	}

	//Main init function called on start
	init() {
		debug = this.debug;
		log = this.log;

		this.initFeedbacks();
		this.initTCP();
	}

	//Initialise the Telnet socket
	initTCP() {
		var receivebuffer = '';

		if(this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;

			this.login = false;
		}

		if(this.heartbeatInterval !== undefined){
			clearInterval(this.heartbeatInterval);
		}

		if (this.config.port === undefined){
			this.config.port = 10000;
		}

		if (this.config.host) {
			this.socket = new telnet(this.config.host,this.config.port);

			this.socket.on('status_change', (status, message) => {
				if(status !== this.STATUS_OK) {
					this.status(status, message);
				}
			});
			
			this.socket.on('error', (err) => {
				this.debug("Network error", err);
				this.log('error',"Network error: " + err.message);
				this.login = false;
			});
			
			this.socket.on('connect', () => {
				this.debug("Connected");
				this.login = false;
			});
			
			this.socket.on('end', () => {
				this.debug("Disconnected")
				if (this.heartbeatInterval !== undefined){
					clearInterval(this.heartbeatInterval);
				}
				this.debug("Heartbeat Destroyed");
				this.login = false;
			});

			this.socket.on('data', (chunk) => {
				var i = 0, line = '', offset = 0;
				receivebuffer += chunk;

				// Split up Lines with new line and Process
				while ( (i = receivebuffer.indexOf('\r', offset)) !== -1) {
					line = receivebuffer.substr(offset, i - offset);
					offset = i + 1;
					this.processLine(line.toString("utf8"));
				}
				receivebuffer = receivebuffer.substr(offset);

				// Handle Login Prompts
				if (this.login === false && receivebuffer.match(/PASSWORD:/)){
					this.socket.write(this.config.pass + '\r\n');
				}
			});
		}
	}

	//Processes lines recieved
	processLine(data){
		
		if (this.login === false && data.match(/Hello/)){
			//Successful Login
			this.login = true;
			this.status(this.STATUS_OK);
			this.log('info', 'Projector Login Successful.')
			this.socket.write("CR0\r\n"); // get current status

			this.heartbeatInterval = setInterval(
				this.sendHeartbeatCommand.bind(this),
				(this.heartbeatTime*1000)
			);
		} else if (data.match (/00/)) {
			// Power On
			this.projectorStatus = "ON";
			this.checkFeedbacks('output_bg');
		} else if (data.match (/20/)) {
			// Cooling
			this.projectorStatus = "COOLING";
			this.checkFeedbacks('output_bg');
		} else if (data.match (/40/)) {
			// Countdown
			this.projectorStatus = "WAIT";
			this.checkFeedbacks('output_bg');
		} else if (data.match (/80/)) {
			// Standby
			this.projectorStatus = "STANDBY";
			this.checkFeedbacks('output_bg');
		}
	}

	//Send new line to keep connection alive
	sendHeartbeatCommand() {
		this.socket.write("CR0\r\n");
	}
	
	// Define feedbacks
	initFeedbacks() {
		var feedbacks = this.getFeedbacks();
		this.setFeedbackDefinitions(feedbacks);
	}

	//On Config changes apply new config
	updateConfig(config) {
		var resetConnection = false;

		if (this.config != config) {
			resetConnection = true;
		}

		this.config = config;

		this.outputs = [];
		this.actions();
		this.initFeedbacks();

		if (resetConnection === true || this.socket === undefined) {
			this.initTCP();
		}
	}
}

exports = module.exports = instance;