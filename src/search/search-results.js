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
            addRemoveMessage: "Add to",
            loggedIn: false,
            lists: []
        }
    }

    handleChange(listId, itemId, itemExists) {
        const list = {
            listId: listId,
            itemId: itemId,
            add: !itemExists
        }

        axios.post('http://localhost:3000/ajax/add-item-to-list', { list })
            .then(res => {
                console.log("Added item to list.");
            });

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

                const includedItems = [];
                this.state.lists.forEach((itemList) => {
                    if (itemList.items.includes(result.id)) {
                        //this.setState( addRemoveMessage: "Remove from");
                        const itemExists = true;
                        includedItems.push(
                            <form onClick={(e) => this.handleChange(itemList.id, result.id, itemExists)}>
                                <button type="button" className="dropdown-item">{this.state.addRemoveMessage} {itemList.name}</button>
                            </form>
                        );
                    } else {
                        this.state.addRemoveMessage = "Add to";
                        const itemExists = false;
                        includedItems.push(
                            <form onClick={(e) => this.handleChange(itemList.id, result.id, itemExists)}>
                                <button type="button" className="dropdown-item">{this.state.addRemoveMessage} {itemList.name}</button>
                            </form>
                        );
                    }
                });

                list.push(
                    <li key={result.id} className="col-6 col-sm-4 col-md-3">

                            <div className="search-result-container">
                                <div className="dropdown">
                                    <button className="btn btn-outline-secondary dropdown-toggle" type="button"
                                            data-toggle="dropdown" aria-haspopup="true" id="dropdownMenuButton">
                                        +
                                    </button>
                                    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                        {includedItems}
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
