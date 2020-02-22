import React from "react";
import $ from 'jquery';
import DropdownList from './dropdown-list';

/**
 *
 */
export default class SearchResults extends React.Component {
    /**
     *
     * @param props
     */
    constructor(props) {
        super(props);
        this.state = {
            loggedIn: false,
            lists: []
        }
    }

    componentDidMount() {
        $.get( '/list/user-lists', function(data) {
            this.setState( { loggedIn: data[0].loggedIn } );
            this.setState( { lists: data[1] } );
        }.bind(this));
    }

    buildResults() {
        // No results case.
        if (this.props.results.length === 0) {
            return (
                <p>
                    There were no results for your search. Please try different terms or remove some filters and
                    try again.
                </p>
            );
        }

        const list = [];
        for (let result of this.props.results) {
            if (this.state.loggedIn && this.state.lists.length > 0) {
                let exp = '(item|villager)-(.*)';
                const split = result.id.match(exp);
                const entityData = { entityId: split[2], type: split[1] };
                list.push(
                    <li key={result.id} className="col-6 col-sm-4 col-md-3">
                            <div className="search-result-container">
                                <DropdownList entityData={entityData} lists={this.state.lists}/>
                                <div>
                                    <a href={result.url}>
                                        <img src={result.imageUrl}
                                             alt={'Picture of ' + result.name} className="img-responsive" />
                                        <p>{result.name}</p>
                                    </a>
                                </div>
                            </div>

                    </li>
                );
            } else {
                list.push(
                    <li key={result.id} className="col-6 col-sm-4 col-md-3">
                        <a href={result.url}>
                            <div className="search-result-container">
                                <img src={result.imageUrl}
                                     alt={'Picture of ' + result.name} className="img-responsive"/>
                                <p>{result.name}</p>
                            </div>
                        </a>
                    </li>
                );
            }
        }

        return list;
    }

    /**
     *
     * @returns {*}
     */
    render() {
        // Build result list.
        return (
            <ul className="list-unstyled row">
                {this.buildResults()}
            </ul>
        );
    }
}
