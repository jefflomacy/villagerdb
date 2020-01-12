import React from "react";
import axios from "axios";

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
        axios.get('http://localhost:3000/ajax/get-user-lists')
            .then(res => {
                const loggedIn = res.data[0].loggedIn;
                const lists = res.data[1];
                this.setState( { loggedIn: loggedIn } );
                this.setState( { lists: lists } );
            })
            .catch(error => {
                console.log(error);
            })
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
            if (this.state.loggedIn) {
                list.push(
                    <li key={result.id} className="col-6 col-sm-4 col-md-3">

                            <div className="search-result-container">
                                <div className="dropdown">
                                    <button className="btn btn-outline-secondary dropdown-toggle" type="button"
                                            data-toggle="dropdown" aria-haspopup="true" id="dropdownMenuButton">
                                        +
                                    </button>
                                    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                        {this.state.lists.map(list => <a className="dropdown-item">{list.name}</a>)}
                                    </div>
                                </div>

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
