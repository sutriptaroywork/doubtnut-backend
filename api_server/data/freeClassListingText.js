module.exports = {
    bannerText1(locale) {
        if (locale === 'hi') {
            return 'क्लासेस पूरी करें और डाउटनट रूपया जीतें!';
        }
        return 'Complete classes and win Doubtnut Rupaya!';
    },
    bannerText2(locale) {
        if (locale === 'hi') {
            return 'बेहतरीन इनाम जीतने के लिए DNR (डाउटनट रूपया) उपयोग करें।';
        }
        return 'Redeem DNR (Doubtnut Rupaya) to win exciting rewards.';
    },
    bannerText3(locale) {
        if (locale === 'hi') {
            return 'आपके दोस्त भी देख रहे हैं!';
        }
        return 'Your friends are also watching!';
    },
    redirectToNotWatched(locale, classCount) {
        if (locale === 'hi') {
            return `इस अध्याय में देखने के लिए ${classCount} क्लासेस हैं जिन्हें आपने अभी तक शुरू नहीं किया है!`;
        }
        return `There are ${classCount} classes to watch in this chapter that you haven’t started yet!`;
    },
    redirectToContinueWatching(locale, classCount) {
        if (locale === 'hi') {
            return `${classCount} क्लासेस पूरी करें जो आप पहले देख रहे थे!`;
        }
        return `Complete ${classCount} classes that you were watching earlier!`;
    },
    redirectToNotWatched2(locale, classCount) {
        if (locale === 'hi') {
            return `केवल ${classCount} क्लासेस देखकर इस अध्याय को पूरा करें!`;
        }
        return `Complete this chapter by just watching ${classCount} classes!`;
    },
    emptyStateImageSubtextWatched(locale) {
        if (locale === 'hi') {
            return 'You have not completed any class!';
        }
        return 'You have not completed any class!';
    },
    emptyStateImageSubtextNotWatched(locale) {
        if (locale === 'hi') {
            return 'देखने के लिए कोई क्लास नहीं है!';
        }
        return 'No class to watch!';
    },
    traslateText(locale, text) {
        if (locale === 'hi') {
            const translations = {
                sort: 'सॉर्ट',
                'most popular': 'सबसे लोकप्रिय',
                'most recent': 'सबसे नया',
                oldest: 'सबसे पुराना',
                subject: 'विषय',
                chapter: 'अध्याय',
                'class type': 'क्लास',
                teacher: 'शिक्षक',
                medium: 'माध्यम',
                all: 'सभी',
                'live class': 'लाइव क्लास',
                'upcoming class': 'आने वाली क्लास',
                'past class': 'पुरानी क्लास',
                'continue watching': 'देखना जारी रखें',
                'not watched': 'नहीं देखा',
                watched: 'देखा है',
                upcoming: 'आने वाली',
                live: 'लाइव',
                'watch now': 'अभी देखें',
                'notify me': 'सूचित करें',
                notified: 'अधिसूचित',
                'watch again': 'दोबारा देखें',
                'free classes for you': 'आपके लिए फ्री क्लासेस',
                filter: 'फिल्टर',
                maths: 'गणित',
                science: 'विज्ञान',
                english: 'अंग्रेज़ी',
                'social science': 'सामाजिक विज्ञान',
                'english grammar': 'अंग्रेज़ी व्याकरण',
                physics: 'भौतिक विज्ञान',
                chemistry: 'रसायन विज्ञान',
                biology: 'जीव- विज्ञान',
                'iit jee': 'आईआईटी जेईई',
                neet: 'नीट',
                reasoning: 'रीज़निंग',
                polity: 'पॉलिटी',
                history: 'इतिहास',
                economics: 'अर्थशास्त्र',
                geography: 'भूगोल',
                'general awareness': 'सामान्य जागरूकता',
                cdp: 'सीडीपी',
                evs: 'ईवीएस',
                sanskrit: 'संस्कृत',
                sst: 'सामाजिक विज्ञान',
                'general science': 'सामान्य विज्ञान',
                'general studies': 'जनरल स्टडी',
                ssc: 'एसएससी',
                banking: 'बैंकिंग',
                teaching: 'टीचिंग',
                railway: 'रेलवे',
                defence: 'डिफेंस',
                'iss filter ke liye koi results available nahi hai': 'इस फिल्टर के लिए कोई परिणाम उपलब्ध नहीं है',
                'you have not completed any class!': 'आपने कोई क्लास पूरी नहीं की है!',
                'no class to watch!': 'देखने के लिए कोई क्लास नहीं है!',
                'complete now': 'अभी पूरा करें',
                'apply filter': 'फिल्टर लगायें',
                'change filter': 'फ़िल्टर बदलें',
                'filter your results': 'अपने परिणाम फ़िल्टर करें',
                'clear all filter': 'फ़िल्टर हटाएं',
                hindi: 'हिंदी',
                'hindi grammar': 'हिंदी व्याकरण',
                'child development and pedagogy': 'बाल विकास और शिक्षाशास्त्र',
                'environmental studies': 'पर्यावरण अध्ययन',
                'current affairs': 'सामयिकी',
                'teaching aptitude': 'शिक्षण योग्यता',
                classes: 'क्लासेस',
            };
            return translations[text.toLowerCase()] ? translations[text.toLowerCase()] : text;
        }
        return text;
    },

    getWatchingAndDurationText(locale, classType, watching, duration) {
        if (locale === 'hi') {
            if (classType.toLowerCase() === 'live') {
                return duration ? `${watching} देख रहे हैं | ${duration} मिनट` : `${watching} देख रहे हैं `;
            }
            if (classType.toLowerCase() === 'upcoming') {
                return `${watching} की रुचि है`;
            }
            return duration ? `${watching} देखा है | ${duration} मिनट` : `${watching} देखा है `;
        }
        if (classType.toLowerCase() === 'live') {
            return duration ? `${watching} watching | ${duration} min` : `${watching} watching`;
        }
        if (classType.toLowerCase() === 'upcoming') {
            return `${watching} interested`;
        }
        return duration ? `${watching} attended | ${duration} min` : `${watching} attended`;
    },

};
