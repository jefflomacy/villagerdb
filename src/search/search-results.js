import React from "react";
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
            // Result item.
            const split = result.id.match('(item|villager)-(.*)');
            list.push(
                <li key={result.id} className="col-6 col-sm-4 col-md-3">
                    <div className="search-result-container">
                        <DropdownList entityId={split[2]} entityType={split[1]} />
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
