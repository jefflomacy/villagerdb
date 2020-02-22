import React from "react";

export default class DropdownList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false
        };
    }

    render() {
        let labelClass = 'fa-plus';
        let showClass = '';
        if (this.state.isLoading) {
            labelClass = 'fa-spin fa-spinner';
        } else if (this.state.isExpanded) {
            showClass = 'show';
        }

        return (
            <div className={'dropdown ' + showClass}>
                <button type="button" className="btn btn-outline-secondary" onClick={this.buttonClicked.bind(this)}>
                    <span className={'fa ' + labelClass}></span>
                </button>
                <div className={'dropdown-menu ' + showClass}>
                    <button className="dropdown-item">
                        things and stuff
                    </button>
                    <button className="dropdown-item">
                        stuff and things
                    </button>
                </div>
            </div>
        );
    }

    buttonClicked() {
        if (this.state.isLoading) {
            return; // don't load twice.
        } else if (this.state.isExpanded) {
            this.setState({
                isExpanded: false // collapse
            });
            return;
        } else {
            // Start loading sequence.
            this.setState({
                isLoading: true
            });

            setTimeout(function() {
                this.setState({isLoading: false, isExpanded: true});
            }.bind(this), 1000)
        }
    }
}