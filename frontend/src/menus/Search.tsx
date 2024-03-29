import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import Layout from "../Layout";
import Chirp from "../home/Chirp";
import FeedButton from "../home/FeedButton";
import UserSearchResult from "./UserSearchResult";
import SpinningCircle from "../SpinningCircle";
import useSort from "../hooks/useSort";
import ChirpPlaceholder from "../placeholders/ChirpPlaceholder";

export enum SearchFeed {
    Chirps,
    Users,
    None
} 

function Search () {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFeed, setSelectedFeed] = useState(SearchFeed.None);
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
                setSelectedFeed(SearchFeed.Users);
                break;
            case "chirps":
                setSelectedFeed(SearchFeed.Chirps);
                break;
            default: 
                setSelectedFeed(SearchFeed.Chirps);
                setSearchParams({query: searchQuery, feed: "chirps"})
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const switchFeeds = (feed: SearchFeed) => {
        setSelectedFeed(feed);
        setSearchParams({query: searchQuery, feed: feed === SearchFeed.Users ? "users" : "chirps"})
    }

    useEffect(() => {
        if ((selectedFeed === SearchFeed.Chirps && chirpResults.length === 0 && chirpHasNextPage) ||
            (selectedFeed === SearchFeed.Users && userResults.length === 0 && userHasNextPage))
            search();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFeed])

    const search = async () => {
        let regex = searchQuery;
        if (regex === "*") {
            regex = "[a-zA-Z0-9]"
        } else if (! (/^[a-zA-Z0-9]*$/.test(regex))) {
            return;
        }

        if (selectedFeed === SearchFeed.Users) {
            await searchUsers(regex);
        } else if (selectedFeed === SearchFeed.Chirps) {
            await searchChirps(regex);
        }
    }            

    const searchChirps = async (regex: string) => {
        if (regex === "" || !chirpHasNextPage) {
            return;
        }

        setDoneFetching(false);
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query =
        `query {    
            searchPosts(query: "${regex}", pageNum: ${chirpPageNum}, size: 10, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                posts {
                    id
                    text
                    imageURL
                    isEdited
                    author {
                        username
                        displayName
                        userColor
                        pictureURL
                    }
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "rechirpStatus" : ""}
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
                    authorUsername={post.author.username}
                    authorDisplayName={post.author.displayName}
                    authorPictureURL={post.author.pictureURL}
                    id = {post.id}
                    postDate = {post.postDate}
                    text = {post.text}
                    imageURL = {post.imageURL}
                    key = {post.id}
                    score = {post.score}
                    voteStatus = {userInfo.state.username ? post.voteStatus : 0}
                    rechirpStatus = {userInfo.state.username ? post.rechirpStatus : false}
                    userColor={post.author.userColor}
                    isEdited = {post.isEdited}
                    pinned = {false}
                />
        })))

        setDoneFetching(true);
    }

    const searchUsers = async (regex: string) => {
        if (regex === "" || !userHasNextPage) {
            return;
        }
            
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query =
        `query {    
            searchUsers(query: "${regex}", pageNum: ${userPageNum}, size: 10) {
                users {
                    username
                    displayName
                    followerCount
                    followingCount
                    pictureURL
                    postCount
                    userColor
                    ${userInfo.state.username ? `isFollowing(followerUsername: "${userInfo.state.username}")` : ""}
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
                pictureURL = {user.pictureURL}
                followerCount = {user.followerCount}
                followingCount = {user.followingCount}
                postCount = {user.postCount}
                userColor={user.userColor}
                isFollowing = {user.isFollowing}
                key = {user.username} />
        })))

        setDoneFetching(true)
    }

    useScrollBottom(async () => {
        await search()
    })

    const [sortMethod, sortDirection, sortBubble] = useSort(doneFetching, search, () => {
        setChirpResults([]);
        setChirpPageNum(0);
        setChirpHasNextPage(true);
    })

    let placeholder = null;
    if (selectedFeed === SearchFeed.Users) {
        placeholder = (
            <>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
            </>
        )
    } else if (selectedFeed === SearchFeed.Chirps) {
        placeholder = (
            <>
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
            </>
        )
    }

    let feed: JSX.Element[] | JSX.Element | null = null;
    if (selectedFeed === SearchFeed.Users && userResults.length > 0) {
        feed = userResults;
    } else if (selectedFeed === SearchFeed.Chirps && chirpResults.length > 0) {
        feed = chirpResults;
    } else if (doneFetching) {
        feed = <div className = "text-center text-white text-lg mt-4">
            {searchQuery === "" ? "Search query is blank" : "No results found"}
        </div>;
    }

    return (
        <Layout>
            <div className="mt-2 mx-auto w-5/6 lg:w-3/5 py-2">                

                {selectedFeed === SearchFeed.Chirps ? sortBubble : null}

                <div className = "grid grid-cols-2 mb-6">
                    <FeedButton
                        name = "Chirps"
                        isActive = {selectedFeed === SearchFeed.Chirps}
                        onClick = {() => switchFeeds(SearchFeed.Chirps)}
                    />

                    <FeedButton
                        name = "Users"
                        isActive = {selectedFeed === SearchFeed.Users}
                        onClick = {() => switchFeeds(SearchFeed.Users)}
                    />
                </div>

                <ul className = "w-[95%] mx-auto mt-6"> 
                    {feed}
                    {!doneFetching ? placeholder : null}
                </ul>
            </div>
        </Layout>
    )
}



export default Search