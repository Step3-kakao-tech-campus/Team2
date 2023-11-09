import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { userApi } from '../../service/user';
import { User, userState } from '../../recoil/user';
import { useRecoilState } from 'recoil';
import { CustomError } from '../../service';

type Vendor = 'kakao' | 'google';
const RedirectPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const authCode = searchParams.get('code'); //인가코드
    const { vendor } = useParams<{ vendor: Vendor }>();
    const [, setUser] = useRecoilState(userState);
    useEffect(() => {
        console.log(authCode);
        login();
    }, [authCode]);

    const login = async () => {
        if (!authCode || !vendor) {
            navigate('/error', {
                state: {
                    errorCode: 400,
                    errorMsg: '잘못된 접근입니다',
                },
            });
            return;
        }
        try {
            // console.log(vendor, authCode);
            const token = await userApi.oauthLogin({ vendor, authCode });
            await localStorage.setItem('accessToken', token);
            const userData = await userApi.getUserInfo();
            setUser(userData as User);
            navigate('/album');
        } catch (e) {
            console.log(e);
            const error = e as CustomError;
            navigate('/error', {
                state: {
                    errorCode: error.status,
                    errorMsg: error.message,
                },
            });
        }
    };

    return (
        <div>
            <h1>로그인 중...</h1>
        </div>
    );
};

export default RedirectPage;
