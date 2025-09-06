'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faXTwitter, faFacebook, faYoutube, faTiktok, faPatreon } from '@fortawesome/free-brands-svg-icons';
import { faMugHot, faArrowLeft, faGem } from '@fortawesome/free-solid-svg-icons';

export default function Social() {
  return (
    <div 
      className="min-h-screen py-12 relative"
      style={{
        backgroundImage: 'url(/images/whitemarble.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <button 
        onClick={() => window.history.back()}
        className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-gray-700 text-xl" />
      </button>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Connect With Us</h1>
          <p className="text-xl text-gray-600">Follow us on social media for the latest updates and exclusive content</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Instagram */}
          <div className="flex flex-col items-center">
            <a href="https://www.instagram.com/shop.gemsutopia/" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faInstagram} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">Instagram</span>
          </div>

          {/* X/Twitter */}
          <div className="flex flex-col items-center">
            <a href="https://x.com/gemsutopia_shop?s=11" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faXTwitter} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">X (Twitter)</span>
          </div>

          {/* Facebook - Friends */}
          <div className="flex flex-col items-center">
            <a href="https://www.facebook.com/gemsutopia" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faFacebook} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">Facebook</span>
          </div>

          {/* Facebook - Business */}
          <div className="flex flex-col items-center">
            <a href="https://www.facebook.com/people/Gemsutopia/100089199956397/" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faFacebook} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">Facebook Business</span>
          </div>

          {/* YouTube */}
          <div className="flex flex-col items-center">
            <a href="https://www.youtube.com/channel/UC9FUB2IsVVbZly_ZGwOD2aQ" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faYoutube} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">YouTube</span>
          </div>

          {/* TikTok */}
          <div className="flex flex-col items-center">
            <a href="https://www.tiktok.com/@gemsutopia.shop?_r=1&_d=secCgYIASAHKAESPgo8aBT70sJ9oa2ohCZvXatcJ1hi%2Fn%2F2FvKS7kNHxQx6RizWpJUCoXXPb9vhYwbivEv%2FSQKrFeFUcYP5Qj86GgA%3D&_svg=1&checksum=b799e68cb584ff369e453235c272636f27bc46cb3734644b5b00404b17d0a201&item_author_type=1&sec_uid=MS4wLjABAAAAHIDBTUramYnoo1zM0Chr2s1Rr7wN0JM-rINimiAVs2_RHZK18eD5a_HMhiBhSYPt&sec_user_id=MS4wLjABAAAAHIDBTUramYnoo1zM0Chr2s1Rr7wN0JM-rINimiAVs2_RHZK18eD5a_HMhiBhSYPt&share_app_id=1233&share_author_id=7141949395503350789&share_link_id=CF49B742-10DF-40A8-AA38-110030D378D9&share_scene=1&sharer_language=en&social_share_type=4&source=h5_m&timestamp=1757132306&tt_from=copy&u_code=e3kfaajjk2bik4&ug_btm=b8727%2Cb0&user_id=7141949395503350789&utm_campaign=client_share&utm_medium=ios&utm_source=copy" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faTiktok} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">TikTok</span>
          </div>

          {/* Patreon */}
          <div className="flex flex-col items-center">
            <a href="https://www.patreon.com/cw/Gemsutopia" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faPatreon} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">Patreon</span>
          </div>

          {/* Gem Rock Auctions */}
          <div className="flex flex-col items-center">
            <a href="https://www.gemrockauctions.com/stores/gemsutopia?fbclid=IwY2xjawMolkJleHRuA2FlbQIxMABicmlkETFtbURNclpFeFpLaGEyYVBaAR5-iW7wJHEtpgtfu02BurH8k-VziPEUyaWJiabGlVUunVqLr8gh6O0lP3EuQg_aem_DBDRcXGv_CKkZ8RpCqXcSA" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-purple-700 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faGem} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">Gem Rock Auctions</span>
          </div>

          {/* Buy Me A Coffee */}
          <div className="flex flex-col items-center">
            <a href="#" target="_blank" rel="noopener noreferrer">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                <FontAwesomeIcon icon={faMugHot} className="text-white text-3xl" />
              </div>
            </a>
            <span className="mt-3 text-gray-700 font-medium">Buy Me A Coffee</span>
          </div>
        </div>
      </div>
    </div>
  );
}