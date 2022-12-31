import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import Layout from "../Layout";
import Chirp from "../home/Chirp";
import FeedButton from "../home/FeedButton";
import UserSearchResult from "./UserSearchResult";
import SpinningCircle from "../SpinningCircle";

export enum SearchFeed {
    Chirps,
    Users,
    None
} 

function Search () {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState("");
    const [feedSelected, setFeedSelected] = useState(SearchFeed.None);
    const [doneFetching, setDoneFetching] = useState(false);

    const [chirpResults, setChirpResults] = useState<JSX.Element[]>([]);
    const [chirpPageNum, setChirpPageNum] = useState(0);

    const [userResults, setUserResults] = useState<JSX.Element[]>([]);
    const [userPageNum, setUserPageNum] = useState(0);
    const userInfo = useContext(UserContext);

    useEffect(() => {
        setQuery(searchParams.get("query") ?? "");
        let feed = searchParams.get("feed") 

        if (feed === "users") {
            setFeedSelected(SearchFeed.Users);
        } else if (feed === "chirps") {
            setFeedSelected(SearchFeed.Chirps);
        } else 
            setFeedSelected(SearchFeed.Chirps);
    }, [])

    useEffect(() => {
        setDoneFetching(false);
        search();
    }, [query, feedSelected])

    const search = () => {
        if (query) {
            if (feedSelected === SearchFeed.Users)
                searchUsers(query);
            else if (feedSelected === SearchFeed.Chirps)
                searchChirps(query);
        }
        
    }
            
    const searchChirps = async (searchQuery: string) => {
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            searchPosts(query: "${searchQuery}", first: ${chirpPageNum}, offset: 10) {
                id
                text
                author {
                    username
                    displayName
                }
                postDate(timezone: ${timezone})
                score
                ${userInfo.state.username ? "voteStatus" : ""}
            }
        }`

        
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)


        
        let info = response.data.searchPosts;
        setChirpPageNum(chirpPageNum + 1);

        setChirpResults(chirpResults.concat(info.map((post: PostPayload) => {
            return <Chirp
                    authorUsername={post.author.username ?? ""}
                    authorDisplayName={post.author.displayName}
                    id = {post.id}
                    postDate = {post.postDate}
                    text = {post.text}
                    key = {post.id}
                    score = {post.score}
                    voteStatus = {userInfo.state.username ? post.voteStatus : 0}
                    pinned = {false}
                />
        })))

        setDoneFetching(true);
    }

    const searchUsers = async (searchQuery: string) => {
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            searchUsers(query: "${searchQuery}", first: ${userPageNum}, offset: 10) {
                username
                displayName
                followerCount
                followingCount
                postCount
            }
        }`

        
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)

        
        let info = response.data.searchUsers;
        setUserPageNum(userPageNum + 1);

        setUserResults(userResults.concat(info.map((user: UserPayload) => {
            return <UserSearchResult
                    username={user.username}
                    displayName={user.displayName}
                    followerCount = {user.followerCount}
                    followingCount = {user.followingCount}
                    postCount = {user.postCount}
                    key = {user.username} />
        })))

        setDoneFetching(true)
    }

    const switchFeeds = (feed: SearchFeed) => {
        setFeedSelected(feed);
        setDoneFetching(false)
        setSearchParams({query: query, feed: feed === SearchFeed.Users ? "users" : "chirps"})
    }

    useScrollBottom(search)

    let feed: JSX.Element[] | JSX.Element = <SpinningCircle /> 
    if (feedSelected === SearchFeed.Users && userResults.length > 0) {
        feed = userResults;
    } else if (feedSelected === SearchFeed.Chirps && chirpResults.length > 0) {
        feed = chirpResults;
    } else if (doneFetching) {
        feed = <div className = "text-center text-white text-lg mt-4">No results found</div>;
    }

    return (
        <Layout>
            <div className="mt-2 mx-auto w-5/6 lg:w-3/5 py-2">                
                <h1 className = "text-2xl text-white text-center mb-2">Search Results</h1>

                <div className = "grid grid-cols-2">
                    <FeedButton
                        name = "Chirps"
                        isActive = {feedSelected === SearchFeed.Chirps}
                        onClick = {() => switchFeeds(SearchFeed.Chirps)}
                    />

                    <FeedButton
                        name = "Users"
                        isActive = {feedSelected === SearchFeed.Users}
                        onClick = {() => switchFeeds(SearchFeed.Users)}
                    />
                </div>

                <ul> {feed} </ul>
            </div>
        </Layout>
    )
}



export default Search