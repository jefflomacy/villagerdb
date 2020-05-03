import React from "react";
import ReactDOM from "react-dom"
import $ from 'jquery'

import Paginator from './paginator.js';
import SearchResults from './search-results.js';
import Loader from './loader.js';
import FilterList from './filter-list.js';
import AppliedFilters from './applied-filters.js';

/**
 *
 */
class Browser extends React.Component {
    /**
     *
     * @param props
     */
    constructor(props) {
        super(props);

        // Initialize state.
        this.state = JSON.parse(this.props.initialState);

        // Bindings
        this.setPage = this.setPage.bind(this);
        this.setAppliedFilters = this.setAppliedFilters.bind(this);
    }

    componentDidMount() {
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                this.setState(event.state);
            } else {
                this.setState(JSON.parse(this.props.initialState));
            }
        });
    }
    /**
     *
     * @returns {*}
     */
    render() {
        // Error case.
        if (this.state.error) {
            return (
                <p className="p-3 mb-2 bg-danger text-white">
                    We're having some trouble. Try refreshing the page.
                </p>
            );
        }

        // Show loader?
        let loader = null;
        if (this.state.isLoading) {
            loader = (
                <Loader/>
            );
        }

        // Now, render!
        return (
            <div id={this.props.id}>
                {loader}
                <div className="row">
                    <div className="col-12 col-md-3">
                        <FilterList onFilterChange={this.setAppliedFilters}
                                    availableFilters={this.state.availableFilters}
                                    appliedFilters={this.state.appliedFilters}
                                    allFilters={this.props.allFilters} />
                    </div>
                    <div className="col-12 col-md-9">
                        <AppliedFilters onFilterChange={this.setAppliedFilters}
                                        appliedFilters={this.state.appliedFilters}
                                        allFilters={this.props.allFilters} />
                        <div className="browser-results-container">
                            <Paginator onPageChange={this.setPage}
                                       currentPage={this.state.currentPage}
                                       startIndex={this.state.startIndex}
                                       endIndex={this.state.endIndex}
                                       totalCount={this.state.totalCount}
                                       totalPages={this.state.totalPages}
                                       topAnchor="#browser" />
                            <SearchResults results={this.state.results} />
                            <Paginator onPageChange={this.setPage}
                                       currentPage={this.state.currentPage}
                                       startIndex={this.state.startIndex}
                                       endIndex={this.state.endIndex}
                                       totalCount={this.state.totalCount}
                                       totalPages={this.state.totalPages}
                                       topAnchor="#browser" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    getResults(pageNumber, appliedFilters) {
        // On update, just consume the state.
        const updateState = (state) => {
            state.isLoading = false;
            let url = this.buildUrlFromState(state.currentPage, state.appliedFilters);
            history.pushState(state, null, url);
            this.setState(state);
        };

        // Make AJAX request to get the page.
        let url = this.buildUrlFromState(pageNumber, appliedFilters);
        if (url.includes('?')) {
            url += '&isAjax=true';
        } else {
            url += '?isAjax=true'
        }

        this.setState({
            appliedFilters: appliedFilters,
            currentPage: pageNumber,
            isLoading: true
        });
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: updateState,
            error: this.onError.bind(this)
        });
    }

    setPage(pageNumber) {
        this.getResults(pageNumber, this.state.appliedFilters);
    }

    setAppliedFilters(filters) {
        // Changing the filters will always put us back on page 1.
        this.getResults(1, filters);
    }

    onError() {
        this.setState({
            isLoading: false,
            error: true
        });
    }

    buildUrlFromState(pageNumber, appliedFilters) {
        // Build out from applied filters
        const applied = [];
        for (let filterId in appliedFilters) {
            const values = [];
            for (let value of appliedFilters[filterId]) {
                values.push(encodeURIComponent(value));
            }
            applied.push(filterId + '=' + values.join(','));
        }
        const filterQuery = applied.length > 0 ? ('?' + applied.join('&')) : '';
        let url = this.props.pageUrlPrefix + pageNumber + filterQuery;
        return url;
    }
}

/**
 * When DOM ready, initialize the browser.
 */
$(document).ready(function() {
    const targetElement = $('#entity-browser');
    if (targetElement.length !== 1) {
        return;
    }
    
    const initialState = targetElement.attr('data-initial-state');
    const allFilters = targetElement.data('all-filters');
    const pageUrlPrefix = targetElement.data('page-url-prefix');
    ReactDOM.render(<Browser id="browser" initialState={initialState}
        allFilters={allFilters} pageUrlPrefix={pageUrlPrefix} />, targetElement[0]);
})
