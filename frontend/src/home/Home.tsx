import { useContext, useEffect, useState } from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp, { Rechirper } from "./Chirp";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
import SpinningCircle from "../SpinningCircle";
import PostComposer from "./PostComposer";
import { PostPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort from "../hooks/useSort";

export enum Feed { None, Trending, All, Following }

function Home() {
    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)

    const [allFeed, setAllFeed] = useState<JSX.Element[]>([]);
    const [trendingFeed, setTrendingFeed] = useState<JSX.Element[]>([]);
    const [followingFeed, setFollowingFeed] = useState<JSX.Element[] | null>([]);
        
    const [allPageNum, setAllPageNum] = useState(0);
    const [trendingPageNum, setTrendingPageNum] = useState(0);
    const [followingPageNum, setFollowingPageNum] = useState(0);

    const [allHasNextPage, setAllHasNextPage] = useState(true);
    const [trendingHasNextPage, setTrendingHasNextPage] = useState(true);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

    const [doneFetching, setDoneFetching] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate(); 

    const [searchParams, setSearchParams] = useSearchParams();

    const switchFeeds = (feed: Feed) => {
        setFeedSelected(feed);
        setDoneFetching(false);
        setSearchParams({ feed: feed === Feed.All ? "all" : feed === Feed.Trending ? "trending" : "following" })
    }

    useEffect(() => {
        if (feedSelected === Feed.None) //inital page load
            return;

        if ((feedSelected === Feed.All && allFeed.length) === 0 ||
            (feedSelected === Feed.Trending && trendingFeed.length) === 0 ||
            (feedSelected === Feed.Following && followingFeed !== null && followingFeed.length === 0)) {
                getChirps();
            } else {
                setDoneFetching(true)
            }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedSelected])

    useEffect(() => {
        //initial page load
        switch (searchParams.get("feed")) {
            case "all":
                setFeedSelected(Feed.All)
                return;
            case "trending":
                setFeedSelected(Feed.Trending)
                return;
            case "following":
                setFeedSelected(Feed.Following)
                return;
            default:
                setFeedSelected(Feed.All);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps 
    }, [])


    const getChirps = async () => {
        let type = "";
        let pageNum = 0
        if (feedSelected === Feed.Following) {
            if (userInfo.state.username === "") {
                navigate(`/signin?return=${window.location.pathname}`)
                return;
            }
            if (!followingHasNextPage) {
                setDoneFetching(true);
                return;
            }
                
            type = "following";
            pageNum = followingPageNum;
        } else if (feedSelected === Feed.Trending) {
            if (!trendingHasNextPage) {
                setDoneFetching(true);
                return;
            }

            type = "trending";
            pageNum = trendingPageNum;
        } else if (feedSelected === Feed.All) {
            if (!allHasNextPage) {
                setDoneFetching(true);
                return;
            }

            type = "all";
            pageNum = allPageNum;
        } else {
            return;
        }

        let usernameField = "";
        if (feedSelected === Feed.Following) {
            usernameField = `, username: "${userInfo.state.username}"`
        } else if (userInfo.state.username)
        usernameField = `, relatedUsername: "${userInfo.state.username}"`
        
        let sortField = "";
        if (feedSelected === Feed.All || feedSelected === Feed.Following)
            sortField = `, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}"`;

        
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
                ${type}Posts(pageNum: ${pageNum}, size: 10${usernameField}${sortField}) {
                    hasNext
                    posts {
                        id
                        text
                        isEdited
                        author {
                            username
                            displayName
                            userColor
                        }
                        postDate(timezone: ${timezone})
                        score
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}

                        ${feedSelected !== Feed.Following ? "" :
                        `isRechirp
                        rootPost {
                            author {
                                username
                                displayName
                                userColor
                            }
                            id
                            text
                            isEdited
                            
                            postDate(timezone: ${timezone})
                            score
                            ${userInfo.state.username ? "voteStatus" : ""}
                            ${userInfo.state.username ? "rechirpStatus" : ""}
                        }`
                        }
                    }
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


        const info = response.data[`${type}Posts`];
        setDoneFetching(true);
        
        if (!info) {
            if (feedSelected === Feed.Following)
                setFollowingFeed(null);
            return;
        }

        const newChirps = info.posts.map((post: PostPayload) => {
            let rechirper: Rechirper | undefined = undefined
            if (feedSelected === Feed.Following && post.isRechirp) {
                if (post.rootPost == null) {
                    return null
                } else {
                    rechirper = {
                        username: post.author.username,
                        displayName: post.author.displayName,
                        userColor: post.author.userColor,
                        dateRechirped: post.postDate
                    } 

                    post = post.rootPost;
                }
            }
            
            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                key={post.id}
                score={post.score}
                voteStatus = {userInfo.state.username ? post.voteStatus : 0}
                rechirpStatus = {userInfo.state.username ? post.rechirpStatus : false}
                userColor={post.author.userColor}
                isEdited = {post.isEdited}
                pinned = {null} //only shows on profile

                rechirper = {rechirper}

            />
        })

        if (feedSelected === Feed.All) {
            setAllFeed(allFeed.concat(newChirps));
            setAllPageNum(allPageNum + 1);
            setAllHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Trending) {
            setTrendingFeed(trendingFeed.concat(newChirps));
            setTrendingPageNum(trendingPageNum + 1);
            setTrendingHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Following && followingFeed !== null) {
            setFollowingFeed(followingFeed.concat(newChirps));
            setFollowingPageNum(followingPageNum + 1);
            setFollowingHasNextPage(info.hasNext);
        }
    }

    

    let msg = null;
    let feed = null;
    switch (feedSelected) {
        case Feed.All:
            feed = allFeed;
            break;
        case Feed.Trending:
            feed = trendingFeed;
            break;
        case Feed.Following:
            if (followingFeed !== null)
                feed = followingFeed;
            else
                msg = "You are not following any users";
            break;
        default:
            break;
    }

    if (feed && doneFetching) {
        if (feed.length === 0) {
            msg = "No chirps... other than the crickets chirping!"
            feed = null
        } else {
            switch (feedSelected) {
                case Feed.All:
                    if (!allHasNextPage) {
                        msg = "You reached the end of the all feed. You saw all chirps ever made!"
                    }
                    break;
                case Feed.Trending:
                    if (!trendingHasNextPage) {
                        msg = "You reached the end of the trending feed. Only chirps from the past 24 hours are here"
                    }
                    break;
                case Feed.Following:
                    if (!followingHasNextPage) {
                        msg = "You reached the end of your following feed"
                    }
                    break;
                default: 
                    break;
            }
        }
    }
    

    useScrollBottom(async () => {
        setDoneFetching(false)
        await getChirps()
    })

    const [sortMethod, sortDirection, sortBubble] = useSort(doneFetching, getChirps, () => {
        setAllFeed([])
        setFollowingFeed([])

        setAllPageNum(0)
        setFollowingPageNum(0)

        setAllHasNextPage(true)
        setFollowingHasNextPage(true)
    })
    
    return (<Layout>
        
        {userInfo.state.username ?
            <div className = "w-full bg-black/20 shadow-md pt-8">
                <div className="mx-auto w-5/6 lg:w-3/5 py-2">
                        <PostComposer />
                </div>
            </div> 
        : <div />}

        <div className="mx-auto w-5/6 lg:w-3/5 py-2 mt-4">
            {feedSelected !== Feed.Trending ? sortBubble : null}
            
            <div className="grid grid-cols-3  mb-6">
                <FeedButton
                    name={"Trending"}
                    onClick={() => switchFeeds(Feed.Trending)}
                    isActive={feedSelected === Feed.Trending} />
                <FeedButton
                    name={"All"}
                    onClick={() => switchFeeds(Feed.All)}
                    isActive={feedSelected === Feed.All} />
                <FeedButton
                    name={"Following"}
                    onClick={() => switchFeeds(Feed.Following)}
                    isActive={feedSelected === Feed.Following} />
            </div>

            <ul className = "mt-6 w-[95%] mx-auto">
                {feed}
                
                <div className = "text-center text-white text-lg my-4">{msg}</div>

                {!doneFetching ?
                    <SpinningCircle /> 
                : null}

                
            </ul>
        </div>
    </Layout>)
}



export default Home;
