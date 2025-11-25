import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { API } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface SongRanking {
  id: number;
  score: number;
  songs: {
    song_id: string;
    spotify_id: string;
    song_name: string;
    artist_name: string;
    album_name: string | null;
    cover_art_url: string | null;
  };
}

interface SongRankingModalProps {
  visible: boolean;
  onClose: () => void;
  onRankingComplete: (score: number | null) => void;
  selectedSong: {
    spotifyId: string;
    name: string;
    artist: string;
    coverArtUrl?: string | null;
  } | null;
  mutedColor: string;
  primaryColor: string;
  textColor: string;
  surfaceColor: string;
  borderColor: string;
}

type RatingCategory = "loved" | "liked" | "disliked" | null;
type ComparisonStep = "initial-rating" | "comparing" | "complete";

export function SongRankingModal({
  visible,
  onClose,
  onRankingComplete,
  selectedSong,
  mutedColor,
  primaryColor,
  textColor,
  surfaceColor,
  borderColor,
}: SongRankingModalProps) {
  const [rankings, setRankings] = useState<SongRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<ComparisonStep>("initial-rating");
  const [selectedCategory, setSelectedCategory] =
    useState<RatingCategory>(null);
  const [comparisons, setComparisons] = useState<SongRanking[]>([]);
  const [currentComparisonIndex, setCurrentComparisonIndex] = useState(0);
  const [betterThan, setBetterThan] = useState<number>(0);
  const [worseThan, setWorseThan] = useState<number>(0);
  const { token } = useAuth();

  useEffect(() => {
    if (visible) {
      resetState();
      fetchUserRankings();
    }
  }, [visible]);

  const resetState = () => {
    setStep("initial-rating");
    setSelectedCategory(null);
    setComparisons([]);
    setCurrentComparisonIndex(0);
    setBetterThan(0);
    setWorseThan(0);
  };

  const fetchUserRankings = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API.BACKEND_URL}/api/posts/rankings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch rankings:", response.status, errorText);
        // If table doesn't exist yet, just continue with empty rankings
        setRankings([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setRankings(data.rankings || []);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      // Continue with empty rankings rather than blocking the UI
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: RatingCategory) => {
    setSelectedCategory(category);

    // Filter songs in the selected category
    let categoryRankings: SongRanking[] = [];
    if (category === "loved") {
      categoryRankings = rankings.filter((r) => r.score >= 7);
    } else if (category === "liked") {
      categoryRankings = rankings.filter((r) => r.score >= 4 && r.score < 7);
    } else if (category === "disliked") {
      categoryRankings = rankings.filter((r) => r.score < 4);
    }

    if (categoryRankings.length === 0) {
      // No comparisons needed, assign default score
      let defaultScore = 5;
      if (category === "loved") defaultScore = 8.5;
      else if (category === "disliked") defaultScore = 2;

      completeRanking(defaultScore);
    } else {
      // Start comparisons
      setComparisons(categoryRankings);
      setCurrentComparisonIndex(0);
      setStep("comparing");
    }
  };

  const handleComparison = (isBetter: boolean) => {
    if (isBetter) {
      setBetterThan((prev) => prev + 1);
    } else {
      setWorseThan((prev) => prev + 1);
    }

    // Move to next comparison or complete
    if (currentComparisonIndex < comparisons.length - 1) {
      setCurrentComparisonIndex((prev) => prev + 1);
    } else {
      // Done with comparisons, calculate score
      calculateFinalScore();
    }
  };

  const calculateFinalScore = () => {
    const totalComparisons = comparisons.length;
    const betterRatio = betterThan / totalComparisons;

    // Get min and max scores from existing songs in this category
    const scores = comparisons.map((c) => c.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    let baseScore = 5;

    // Use anchors: if better than all, score above max; if worse than all, score below min
    if (betterRatio === 1) {
      // Better than everything - place above the current max
      if (selectedCategory === "loved") {
        baseScore = Math.min(maxScore + 0.3, 10); // Cap at 10
      } else if (selectedCategory === "liked") {
        baseScore = Math.min(maxScore + 0.3, 6.9); // Cap at just below "loved"
      } else if (selectedCategory === "disliked") {
        baseScore = Math.min(maxScore + 0.3, 3.9); // Cap at just below "liked"
      }
    } else if (betterRatio === 0) {
      // Worse than everything - place below the current min
      if (selectedCategory === "loved") {
        baseScore = Math.max(minScore - 0.3, 7); // Floor at 7 (bottom of "loved")
      } else if (selectedCategory === "liked") {
        baseScore = Math.max(minScore - 0.3, 4); // Floor at 4 (bottom of "liked")
      } else if (selectedCategory === "disliked") {
        baseScore = Math.max(minScore - 0.3, 0); // Floor at 0
      }
    } else {
      // Between min and max - interpolate based on comparison ratio
      const range = maxScore - minScore;
      baseScore = minScore + betterRatio * range;
    }

    completeRanking(Math.round(baseScore * 10) / 10); // Round to 1 decimal
  };

  const completeRanking = (score: number) => {
    setStep("complete");
    onRankingComplete(score);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSkip = () => {
    onRankingComplete(null); // No score when skipping
    onClose();
  };

  const currentComparison = comparisons[currentComparisonIndex];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cardContainer}>
          <ThemedView
            style={[styles.cardContent, { backgroundColor: surfaceColor }]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  alignContent: "center",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.title,
                  {
                    color: textColor,
                    fontWeight: "300",
                  },
                ]}
              >
                {step === "initial-rating" && "What do you think?"}
                {step === "complete" && "Rating Complete!"}
              </ThemedText>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={primaryColor} />
                  <ThemedText
                    style={[styles.loadingText, { color: mutedColor }]}
                  >
                    Loading your rankings...
                  </ThemedText>
                </View>
              ) : (
                <>
                  {/* Initial Rating Step */}
                  {step === "initial-rating" && selectedSong && (
                    <View style={styles.content}>
                      {/* Selected Song Card */}
                      <View
                        style={[
                          styles.songCard,
                          { backgroundColor: surfaceColor, borderColor },
                        ]}
                      >
                        <ThemedText
                          style={[styles.songName, { color: textColor }]}
                          numberOfLines={2}
                        >
                          {selectedSong.name}
                        </ThemedText>
                        <ThemedText
                          style={[styles.artistName, { color: mutedColor }]}
                        >
                          {selectedSong.artist}
                        </ThemedText>
                      </View>

                      {/* Rating Categories - Single Row */}
                      <View style={styles.categoriesContainer}>
                        <TouchableOpacity
                          style={[
                            styles.categoryButton,
                            {
                              backgroundColor: "#4CAF5020",
                              borderWidth: 1,
                              borderColor: "#4CAF5040",
                            },
                          ]}
                          onPress={() => handleCategorySelect("loved")}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            name="circle.fill"
                            size={44}
                            color="#4CAF50"
                          />
                          <ThemedText
                            style={[
                              styles.categoryTitle,
                              { color: mutedColor },
                            ]}
                          >
                            Loved
                          </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.categoryButton,
                            {
                              backgroundColor: "#FFC10720",
                              borderWidth: 1,
                              borderColor: "#FFC10740",
                            },
                          ]}
                          onPress={() => handleCategorySelect("liked")}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            name="circle.fill"
                            size={44}
                            color="#FFC107"
                          />
                          <ThemedText
                            style={[
                              styles.categoryTitle,
                              { color: mutedColor },
                            ]}
                          >
                            Liked
                          </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.categoryButton,
                            {
                              backgroundColor: "#FF525220",
                              borderWidth: 1,
                              borderColor: "#FF525240",
                            },
                          ]}
                          onPress={() => handleCategorySelect("disliked")}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            name="circle.fill"
                            size={44}
                            color="#FF5252"
                          />
                          <ThemedText
                            style={[
                              styles.categoryTitle,
                              { color: mutedColor },
                            ]}
                          >
                            Disliked
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.skipButton,
                          { borderColor, backgroundColor: surfaceColor },
                        ]}
                        onPress={handleSkip}
                      >
                        <ThemedText
                          style={[styles.skipText, { color: textColor }]}
                        >
                          Skip Rating
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Comparison Step */}
                  {step === "comparing" && currentComparison && (
                    <View style={styles.content}>
                      <ThemedText
                        style={[
                          styles.comparisonQuestion,
                          { color: textColor, fontWeight: "300" },
                        ]}
                      >
                        Which do you prefer?
                      </ThemedText>

                      {/* Side by Side Comparison Cards */}
                      <View style={styles.comparisonCardsRow}>
                        {/* New Song Card */}
                        <TouchableOpacity
                          style={[
                            styles.comparisonSquareCard,
                            {
                              backgroundColor: surfaceColor,
                              borderColor: primaryColor,
                            },
                          ]}
                          onPress={() => handleComparison(true)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.squareCardContent}>
                            {selectedSong?.coverArtUrl && (
                              <Image
                                source={{
                                  uri: selectedSong.coverArtUrl,
                                }}
                                style={styles.comparisonSquareCover}
                              />
                            )}
                            <ThemedText
                              style={[
                                styles.comparisonSongName,
                                { color: textColor },
                              ]}
                              numberOfLines={2}
                            >
                              {selectedSong?.name}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.comparisonArtist,
                                { color: mutedColor },
                              ]}
                              numberOfLines={1}
                            >
                              {selectedSong?.artist}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>

                        {/* Comparison Song Card */}
                        <TouchableOpacity
                          style={[
                            styles.comparisonSquareCard,
                            {
                              backgroundColor: surfaceColor,
                              borderColor: borderColor,
                            },
                          ]}
                          onPress={() => handleComparison(false)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.squareCardContent}>
                            {currentComparison.songs.cover_art_url && (
                              <Image
                                source={{
                                  uri: currentComparison.songs.cover_art_url,
                                }}
                                style={styles.comparisonSquareCover}
                              />
                            )}
                            <ThemedText
                              style={[
                                styles.comparisonSongName,
                                { color: textColor },
                              ]}
                              numberOfLines={2}
                            >
                              {currentComparison.songs.song_name}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.comparisonArtist,
                                { color: mutedColor },
                              ]}
                              numberOfLines={1}
                            >
                              {currentComparison.songs.artist_name}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Complete Step */}
                  {step === "complete" && (
                    <View style={styles.completeContainer}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={80}
                        color={primaryColor}
                      />
                      <ThemedText
                        style={[styles.completeTitle, { color: textColor }]}
                      >
                        Rating Saved!
                      </ThemedText>
                      <ThemedText
                        style={[styles.completeSubtitle, { color: mutedColor }]}
                      >
                        Your song has been added to your rankings
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  cardContent: {
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  scrollView: {
    maxHeight: 600,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  content: {
    paddingBottom: 20,
  },
  songCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
    alignItems: "center",
  },
  songName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  artistName: {
    fontSize: 15,
    textAlign: "center",
  },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  categorySubtitle: {
    fontSize: 11,
    textAlign: "center",
  },
  skipButton: {
    marginTop: 20,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  comparisonProgress: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  comparisonQuestion: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  comparisonCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
  },
  comparisonLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 1,
  },
  comparisonSongName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
    lineHeight: 17,
  },
  comparisonArtist: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
  comparisonCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 12,
  },
  vsText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 16,
  },
  comparisonCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  comparisonSquareCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  squareCardContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
  },
  comparisonSquareCover: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  vsDivider: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  vsTextSmall: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  comparisonButtons: {
    marginTop: 24,
    gap: 12,
  },
  comparisonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  comparisonButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  completeContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});
