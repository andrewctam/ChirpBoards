import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import Layout from "../Layout";
import Chirp from "../home/Chirp";
import FeedButton from "../home/FeedButton";
import UserSearchResult from "./UserSearchResult";
import SpinningCircle from "../SpinningCircle";
import useSort, { SortMethod } from "../hooks/useSort";

export enum SearchFeed {
    Chirps,
    Users,
    None
} 

function Search () {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [feedSelected, setFeedSelected] = useState(SearchFeed.None);
    const [doneFetching, setDoneFetching] = useState(false);

    const [chirpResults, setChirpResults] = useState<JSX.Element[]>([]);
    const [chirpPageNum, setChirpPageNum] = useState(0);
    const [chirpHasNextPage, setChirpHasNextPage] = useState(true);


    const [userResults, setUserResults] = useState<JSX.Element[]>([]);
    const [userPageNum, setUserPageNum] = useState(0);
    const [userHasNextPage, setUserHasNextPage] = useState(true);

    const userInfo = useContext(UserContext);


    useEffect(() => {
        setSearchQuery(searchParams.get("query") ?? "");
        switch(searchParams.get("feed")) {
            case "users":
                setFeedSelected(SearchFeed.Users);
                break;
            case "chirps":
                setFeedSelected(SearchFeed.Chirps);
                break;
            default: 
                setFeedSelected(SearchFeed.Chirps);
                setSearchParams({query: searchQuery, feed: "chirps"})
                break;
        }
    }, [])


    const switchFeeds = (feed: SearchFeed) => {
        setFeedSelected(feed);
        setSearchParams({query: searchQuery, feed: feed === SearchFeed.Users ? "users" : "chirps"})
    }

    useEffect(() => {
        //if (feedSelected === SearchFeed.Chirps && chirpResults.length === 0 && chirpHasNextPage || 
        //    feedSelected === SearchFeed.Users && userResults.length === 0 && userHasNextPage)
            search();
    }, [feedSelected])

    const search = () => {
        if (! (/[a-zA-Z0-9]/.test(searchQuery))) {
            return;
        }

        if (feedSelected === SearchFeed.Users) {
            setDoneFetching(false);
            searchUsers();
        } else if (feedSelected === SearchFeed.Chirps) {
            setDoneFetching(false);
            searchChirps();
        }
    }            

    const searchChirps = async () => {
        if (searchQuery === "" || !chirpHasNextPage) {
            setDoneFetching(true)
            return;
        }


        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            searchPosts(query: "${searchQuery}", pageNum: ${chirpPageNum}, size: 10, sortMethod: "${sortMethod}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                posts {
                    id
                    text
                    author {
                        username
                        displayName
                        userColor
                    }
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "voteStatus" : ""}
                }
                hasNext
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
        setChirpHasNextPage(info.hasNext);

        setChirpResults(chirpResults.concat(info.posts.map((post: PostPayload) => {
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
                    userColor={post.author.userColor}

                />
        })))

        setDoneFetching(true);
    }

    const searchUsers = async () => {
        if (searchQuery === "" || !userHasNextPage) {
            setDoneFetching(true)
            return;
        }
            
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            searchUsers(query: "${searchQuery}", pageNum: ${userPageNum}, size: 10) {
                users {
                    username
                    displayName
                    followerCount
                    followingCount
                    postCount
                    userColor
                }
                hasNext
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
        setUserHasNextPage(info.hasNext);

        setUserResults(userResults.concat(info.users.map((user: UserPayload) => {
            return <UserSearchResult
                username={user.username}
                displayName={user.displayName}
                followerCount = {user.followerCount}
                followingCount = {user.followingCount}
                postCount = {user.postCount}
                userColor={user.userColor}
                key = {user.username} />
        })))

        setDoneFetching(true)
    }

    useScrollBottom(() => {
        setDoneFetching(false)
        search()
    })

    const [sortMethod, sortBubble] = useSort(doneFetching, search, () => {
        setChirpResults([]);
        setChirpPageNum(0);
        setChirpHasNextPage(true);
        setDoneFetching(false);
    })

    

    let feed: JSX.Element[] | JSX.Element = <SpinningCircle /> 
    
    if (feedSelected === SearchFeed.Users && userResults.length > 0) {
        feed = userResults;
    } else if (feedSelected === SearchFeed.Chirps && chirpResults.length > 0) {
        feed = chirpResults;
    } else if (doneFetching) {
        feed = <div className = "text-center text-white text-lg mt-4">
            {searchQuery === "" ? "Search query is blank" : "No results found"}
        </div>;
    }

    return (
        <Layout>
            <h1 className = "text-2xl text-white text-center py-4 bg-black/20 shadow-md">Search Results</h1>
            <div className="mt-2 mx-auto w-5/6 lg:w-3/5 py-2">                

                {feedSelected === SearchFeed.Chirps ? sortBubble : null}

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

                <ul className = "w-[95%] mx-auto mt-6"> 
                    {feed} 
                </ul>
            </div>
        </Layout>
    )
}



export default Search