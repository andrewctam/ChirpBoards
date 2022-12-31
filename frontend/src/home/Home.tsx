import React, { useContext, useEffect, useRef, useState } from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";
import { PostChirp, UserContext } from "../App";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SpinningCircle from "../SpinningCircle";
import PostComposer from "./PostComposer";
import { PostPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";

export enum Feed { None, Following, Recent, Popular }

function Home() {
    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)

    const [recentFeed, setRecentFeed] = useState<JSX.Element[]>([]);
    const [popularFeed, setPopularFeed] = useState<JSX.Element[]>([]);
    const [followingFeed, setFollowingFeed] = useState<JSX.Element[] | null>([]);
        
    const [recentPageNum, setRecentPageNum] = useState(0);
    const [popularPageNum, setPopularPageNum] = useState(0);
    const [followingPageNum, setFollowingPageNum] = useState(0);

    const [doneFetching, setDoneFetching] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate(); 

    const [searchParams, setSearchParams] = useSearchParams();

    const switchFeeds = (feed: Feed) => {
        setFeedSelected(feed);
        setDoneFetching(false)
        setSearchParams({ feed: feed === Feed.Recent ? "recent" : feed === Feed.Popular ? "popular" : "following" })
    }

    useEffect(() => {
        if (feedSelected !== Feed.None)
            getMoreChirps();

    }, [feedSelected])

    useEffect(() => {
        //on load
        switch (searchParams.get("feed")) {
            case "recent":
                setFeedSelected(Feed.Recent)
                return;
            case "popular":
                setFeedSelected(Feed.Popular)
                return;
            case "following":
                setFeedSelected(Feed.Following)
                return;
            default:
                setFeedSelected(Feed.Recent);
        }

    }, [])


    const getMoreChirps = async () => {
        let type = "";
        let pageNum = 0
        if (feedSelected === Feed.Following) {
            if (userInfo.state.username === "")
                navigate("/signin?return=true")
                
            type = "following";
            pageNum = followingPageNum;
        } else if (feedSelected === Feed.Popular) {
            type = "popular";
            pageNum = popularPageNum;
        } else if (feedSelected === Feed.Recent) {
            type = "recent";
            pageNum = recentPageNum;
        } else {
            return;
        }

        let usernameField = "";
        if (feedSelected === Feed.Following)
            usernameField = `, username: "${userInfo.state.username}"`
        else if (userInfo.state.username)
            usernameField = `, relatedUsername: "${userInfo.state.username}"`

        
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
            ${type}Posts(first: ${pageNum}, offset: 10${usernameField}) {
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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response)

        setDoneFetching(true);

        const info = response.data[`${type}Posts`];

        if (!info) {
            if (feedSelected === Feed.Following)
                setFollowingFeed(null);

            return;
        }


        const newChirps = info.map((post: PostPayload) => {
            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                key={post.id}
                score={post.score}
                voteStatus={userInfo.state.username ? post.voteStatus : 0}
            />
        })

        if (feedSelected === Feed.Recent) {
            setRecentFeed([...recentFeed, ...newChirps]);
            setRecentPageNum(recentPageNum + 1);
        } else if (feedSelected === Feed.Popular) {
            setPopularFeed([...popularFeed, ...newChirps]);
            setPopularPageNum(popularPageNum + 1);
        } else if (feedSelected == Feed.Following && followingFeed !== null) {
            setFollowingFeed([...followingFeed, ...newChirps]);
            setFollowingPageNum(followingPageNum + 1);
        }
    }

    let msg = "";
    let feed = null;
    switch (feedSelected) {
        case Feed.Recent:
            feed = recentFeed;
            break;
        case Feed.Popular:
            feed = popularFeed;
            break;
        case Feed.Following:
            if (followingFeed)
                feed = followingFeed;
            else
                msg = "You are not following any users";
            break;
        default:
            break;
    }

    if (feed && feed.length === 0) {
        msg = "No chirps... you can hear the crickets chirping!"
        feed = null
    }
     
    if (!feed && doneFetching)
        feed = <div className = "text-center text-white text-lg mt-4">{msg}</div>
    

    useScrollBottom(getMoreChirps)

    return (<Layout>
        <div className="mt-8 mx-auto w-5/6 lg:w-3/5 py-2">
            {userInfo.state.username ?
                <PostComposer />
            : null}

            <div className="grid rows-2">
                <div className="grid grid-cols-3">
                    <FeedButton
                        name={"Recent"}
                        onClick={() => switchFeeds(Feed.Recent)}
                        isActive={feedSelected === Feed.Recent} />
                    <FeedButton
                        name={"Popular"}
                        onClick={() => switchFeeds(Feed.Popular)}
                        isActive={feedSelected === Feed.Popular} />
                    <FeedButton
                        name={"Following"}
                        onClick={() => switchFeeds(Feed.Following)}
                        isActive={feedSelected === Feed.Following} />
                </div>

                <ul>
                    {feed}

                    {!doneFetching ?
                        <SpinningCircle /> 
                    : null}
                </ul>

            </div>
        </div>
    </Layout>)
}



export default Home;
