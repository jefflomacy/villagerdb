import React from "react";

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
            list.push(
                <li key={result.id} className="col-6 col-sm-4 col-md-3">
                    <a href={result.url}>
                        <div className="search-result-container">
                            <img src={result.imageUrl}
                                 alt={'Picture of ' + result.name} className="img-responsive" />
                            <p>{result.name}</p>
                        </div>
                    </a>
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
