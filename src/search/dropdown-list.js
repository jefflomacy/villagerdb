import React from "react";
import DropdownEntry from './dropdown-entry'

export default class DropdownList extends React.Component {

    constructor(props) {
        super(props);
    }

    buildResults() {
        const result = [];
        const entityLists = [];

        this.props.lists.forEach((entityList) => {
            entityLists.push(
                <DropdownEntry entityList={entityList}
                               entityData={this.props.entityData}/>
            );
        });
        result.push(
                <div className="dropdown" aria-labelledby="dropdownMenuButton">
                    <button className="btn btn-outline-secondary dropdown-toggle" type="button"
                            data-toggle="dropdown" aria-haspopup="true" id="dropdownMenuButton">
                        +
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        {entityLists}
                    </div>
                </div>
        );

        return result;
    }

    render() {
        return this.buildResults();
    }

}