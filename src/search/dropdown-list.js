import React from "react";

export default class DropdownList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="dropdown">
                <button type="button" className="btn btn-outline-secondary">
                    <span className="fa fa-plus"></span>
                </button>
            </div>
        );
    }
}