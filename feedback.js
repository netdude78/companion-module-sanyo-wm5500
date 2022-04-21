module.exports = {

	getFeedbacks() {
		var feedbacks = {
			'output_bg': {
				label: 'Change background colour by projector status',
				description: 'If the projector status changes, change background color of the bank',
				options: [{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(255, 255, 255)
				}, {
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255, 0, 0)
				}, {
					type: 'dropdown',
					label: 'Projector Status',
					id: 'status',
					choices: this.CHOICES_PROJECTORSTATUS,
					default: this.CHOICES_PROJECTORSTATUS[0].id
				},],
				callback: (feedback, bank) => {
					if (this.projectorStatus == feedback.options.status) {
						return {
							color: feedback.options.fg,
							bgcolor: feedback.options.bg
						};
					}
				}
			}
		}
		return feedbacks
	}
}