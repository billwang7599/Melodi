import { StyleSheet } from 'react-native';

export const feedStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  feedContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  postContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 1,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 8,
  },
  songImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 1,
  },
  songArtist: {
    fontSize: 11,
    opacity: 0.6,
  },
  playButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 12,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});
