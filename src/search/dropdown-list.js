import React from "react";
import DropdownEntry from './dropdown-entry'

export default class DropdownList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const entityLists = [];
        this.props.lists.forEach((entityList) => {
            entityLists.push(
                <DropdownEntry key={entityList.id}
                               entityList={entityList}
                               entityData={this.props.entityData}/>
            );
        });

        return (
            <div className="dropdown" aria-labelledby="dropdownMenuButton">
                <button className="btn btn-outline-secondary dropdown-toggle" type="button"
                        data-toggle="dropdown" aria-haspopup="true" id="dropdownMenuButton">
                    +
                </button>
                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    {entityLists}
                </div>
            </div>
        );
    }
}