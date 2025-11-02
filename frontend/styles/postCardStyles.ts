import { StyleSheet } from "react-native";

export const postCardStyles = StyleSheet.create({
  postContainer: {
    borderRadius: 24,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#B8D4E3",
    justifyContent: "center",
    alignItems: "center",
  },
  listeningText: {
    fontSize: 14,
    color: "#6B7280",
  },
  username: {
    fontWeight: "600",
    color: "#1F2937",
  },
  songCardContainer: {
    backgroundColor: "#D6D3D1",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  songCardTop: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  largeAlbumArt: {
    width: 112,
    height: 112,
    borderRadius: 8,
  },
  songInfoBeside: {
    flex: 1,
    justifyContent: "center",
  },
  artistLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  songTitleLarge: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
    lineHeight: 22,
  },
  artistName: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
  },
  starRating: {
    flexDirection: "row",
    gap: 2,
  },
  star: {
    fontSize: 18,
    color: "#000",
  },
  starEmpty: {
    fontSize: 18,
    color: "#000",
  },
  playControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#9CA3AF",
    borderRadius: 2,
  },
  progressFill: {
    width: "8%",
    height: "100%",
    borderRadius: 2,
  },
  timestampBadge: {
    backgroundColor: "#A8A29E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timestampText: {
    fontSize: 11,
    color: "#4B5563",
  },
  description: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#4B5563",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  leftActions: {
    flexDirection: "row",
    gap: 24,
  },
  rightActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  iconButton: {
    padding: 4,
  },
});
