import { useContext, useEffect, useState } from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
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

    const [recentHasNextPage, setRecentHasNextPage] = useState(true);
    const [popularHasNextPage, setPopularHasNextPage] = useState(true);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // eslint-disable-next-line react-hooks/exhaustive-deps 
    }, [])


    const getMoreChirps = async () => {
        let type = "";
        let pageNum = 0
        if (feedSelected === Feed.Following) {
            if (userInfo.state.username === "") {
                navigate(`/signin?return=${window.location.pathname}`)
                return;
            }
            if (!followingHasNextPage)
                return;
                
            type = "following";
            pageNum = followingPageNum;
        } else if (feedSelected === Feed.Popular) {
            if (!popularHasNextPage)
                return;

            type = "popular";
            pageNum = popularPageNum;
        } else if (feedSelected === Feed.Recent) {
            if (!recentHasNextPage)
                return;

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
            ${type}Posts(pageNum: ${pageNum}, size: 10${usernameField}) {
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


        const newChirps = info.posts.map((post: PostPayload) => {
            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                key={post.id}
                score={post.score}
                voteStatus={userInfo.state.username ? post.voteStatus : 0}
                userColor={post.author.userColor}
            />
        })

        if (feedSelected === Feed.Recent) {
            setRecentFeed([...recentFeed, ...newChirps]);
            setRecentPageNum(recentPageNum + 1);
            setRecentHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Popular) {
            setPopularFeed([...popularFeed, ...newChirps]);
            setPopularPageNum(popularPageNum + 1);
            setPopularHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Following && followingFeed !== null) {
            setFollowingFeed([...followingFeed, ...newChirps]);
            setFollowingPageNum(followingPageNum + 1);
            setFollowingHasNextPage(info.hasNext);
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
        {userInfo.state.username ?
            <div className = "w-full bg-black/20 shadow-md pt-8">
                <div className="mx-auto w-5/6 lg:w-3/5 py-2">
                        <PostComposer />
                </div>
            </div> 
        : <div />}

        <div className="mx-auto w-5/6 lg:w-3/5 py-2 mt-4">
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

            <ul className = "mt-6 w-[95%] mx-auto">
                {feed}

                {!doneFetching ?
                    <SpinningCircle /> 
                : null}
            </ul>
        </div>
    </Layout>)
}



export default Home;
